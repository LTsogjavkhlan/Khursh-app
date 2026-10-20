// Per-HOA features: platform admin switches them; the API enforces them.
import { test, before, after } from 'node:test'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'

let h, platformTok, adminTok, ownerTok, outsiderTok, hoaA, hoaB, vehicleId, guestId

before(async () => {
    h = await startServer(5196)
    hoaA = await Hoa.create({ name: 'A' })
    hoaB = await Hoa.create({ name: 'B' })
    await User.create({ email: 'root@x.mn', password: 'secret123', firstName: 'P', lastName: 'A', role: 'platform_admin' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoaA._id, hoaName: 'A' })
    platformTok = await h.login('root@x.mn')
    adminTok = await h.login('admin@a.mn')

    ownerTok = await h.register('owner@x.mn')
    const apt = (await h.api('/api/addresses', { token: ownerTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '1' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })
    vehicleId = (await h.api('/api/vehicles', { token: ownerTok, method: 'POST', body: { plate: '1234УБА', model: 'Prius' } })).data.vehicle._id
    guestId = (await h.api('/api/vehicles/guest-passes', { token: ownerTok, method: 'POST', body: { plate: '5678УБА', expiresAt: new Date(Date.now() + 3600e3).toISOString() } })).data.pass._id
    outsiderTok = await h.register('out@x.mn')
})
after(() => h.stop())

const setFeatures = (hoaId, body, token = platformTok) =>
    h.api(`/api/hoas/${hoaId}/features`, { token, method: 'PUT', body })

test('every feature is on by default, including for HOAs created before features existed', async () => {
    const c = checker()
    const me = (await h.api('/api/auth/me', { token: ownerTok })).data
    c.check('resident sees all features on', JSON.stringify(me.hoaFeatures) === JSON.stringify({ gateOpen: true, vehicleRegistration: true, guestPass: true }), me.hoaFeatures)
    await Hoa.collection.updateOne({ _id: hoaB._id }, { $unset: { features: '' } })
    const overview = (await h.api('/api/hoas/overview', { token: platformTok })).data
    const b = overview.hoas.find(x => x.name === 'B')
    c.check('legacy HOA without features field: all on', Object.values(b.features).every(Boolean), b.features)
    c.check('outsider (no HOA) gets null features', (await h.api('/api/auth/me', { token: outsiderTok })).data.hoaFeatures === null)
    c.done()
})

test('overview: catalog and per-HOA stats', async () => {
    const c = checker()
    const res = await h.api('/api/hoas/overview', { token: platformTok })
    c.check('200', res.status === 200, res.status)
    c.check('catalog lists the 3 features with labels', res.data.catalog.length === 3 && res.data.catalog.every(f => f.key && f.label))
    const a = res.data.hoas.find(x => x.name === 'A')
    c.check('stats for A', JSON.stringify(a.stats) === JSON.stringify({ residents: 1, pending: 0, admins: 1, apartments: 1, vehicles: 1 }), a.stats)
    const b = res.data.hoas.find(x => x.name === 'B')
    c.check('empty HOA has zero stats', Object.values(b.stats).every(n => n === 0), b.stats)
    c.done()
})

test('only platform admins can see the overview or change features', async () => {
    const c = checker()
    c.check('HOA admin: overview 403', (await h.api('/api/hoas/overview', { token: adminTok })).status === 403)
    c.check('resident: overview 403', (await h.api('/api/hoas/overview', { token: ownerTok })).status === 403)
    c.check('HOA admin: update 403', (await setFeatures(hoaA._id, { gateOpen: false }, adminTok)).status === 403)
    c.check('no login: 401', (await h.api(`/api/hoas/${hoaA._id}/features`, { method: 'PUT', body: { gateOpen: false } })).status === 401)
    c.done()
})

test('validation', async () => {
    const c = checker()
    c.check('unknown key rejected', (await setFeatures(hoaA._id, { teleport: true })).status === 400)
    c.check('non-boolean rejected', (await setFeatures(hoaA._id, { gateOpen: 'no' })).status === 400)
    c.check('empty body rejected', (await setFeatures(hoaA._id, {})).status === 400)
    c.check('malformed HOA id: 400', (await setFeatures('abc', { gateOpen: false })).status === 400)
    c.check('unknown HOA: 404', (await setFeatures('a'.repeat(24), { gateOpen: false })).status === 404)
    c.done()
})

test('switching features off blocks adding, keeps viewing and removing', async () => {
    const c = checker()
    const res = await setFeatures(hoaA._id, { vehicleRegistration: false, guestPass: false })
    c.check('update ok', res.status === 200 && res.data.hoa.features.vehicleRegistration === false && res.data.hoa.features.gateOpen === true, res.data)
    const me = (await h.api('/api/auth/me', { token: ownerTok })).data
    c.check('resident sees the change', me.hoaFeatures.vehicleRegistration === false && me.hoaFeatures.guestPass === false && me.hoaFeatures.gateOpen === true)

    const add = await h.api('/api/vehicles', { token: ownerTok, method: 'POST', body: { plate: '9999УБА', model: 'X' } })
    c.check('add vehicle: 403 FEATURE_DISABLED', add.status === 403 && add.data.code === 'FEATURE_DISABLED' && add.data.feature === 'vehicleRegistration', add)
    const guest = await h.api('/api/vehicles/guest-passes', { token: ownerTok, method: 'POST', body: { plate: '1111УБА', expiresAt: new Date(Date.now() + 3600e3).toISOString() } })
    c.check('add guest pass: 403 FEATURE_DISABLED', guest.status === 403 && guest.data.feature === 'guestPass', guest)
    c.check('set primary: 403', (await h.api(`/api/vehicles/${vehicleId}/primary`, { token: ownerTok, method: 'PUT' })).status === 403)

    c.check('list vehicles still works', (await h.api('/api/vehicles', { token: ownerTok })).data.length === 1)
    c.check('list guest passes still works', (await h.api('/api/vehicles/guest-passes', { token: ownerTok })).data.length === 1)
    c.check('remove guest pass still works', (await h.api(`/api/vehicles/guest-passes/${guestId}`, { token: ownerTok, method: 'DELETE' })).status === 200)
    c.check('remove vehicle still works', (await h.api(`/api/vehicles/${vehicleId}`, { token: ownerTok, method: 'DELETE' })).status === 200)
    c.done()
})

test('switching back on restores adding; other HOAs are unaffected', async () => {
    const c = checker()
    await setFeatures(hoaA._id, { vehicleRegistration: true })
    c.check('add vehicle works again', (await h.api('/api/vehicles', { token: ownerTok, method: 'POST', body: { plate: '2222УБА', model: 'Y' } })).status === 201)
    c.check('guestPass still off', (await h.api('/api/auth/me', { token: ownerTok })).data.hoaFeatures.guestPass === false)
    const b = (await h.api('/api/hoas/overview', { token: platformTok })).data.hoas.find(x => x.name === 'B')
    c.check('HOA B untouched', Object.values(b.features).every(Boolean), b.features)
    c.done()
})
