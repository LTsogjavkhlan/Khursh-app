// Route-level fixes: events reach residents; malformed ids are a 400, not a 500.
import { test, before, after } from 'node:test'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'

let h, adminTok, ownerTok

before(async () => {
    h = await startServer(5195)
    const hoa = await Hoa.create({ name: 'A' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoa._id, hoaName: 'A' })
    adminTok = await h.login('admin@a.mn')
    ownerTok = await h.register('owner@x.mn')
    const apt = (await h.api('/api/addresses', { token: ownerTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '1' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })
})
after(() => h.stop())

test('residents see their HOA\'s events', async () => {
    const c = checker()
    await h.api('/api/events', { token: adminTok, method: 'POST', body: { title: 'Цэвэрлэгээ', date: '2026-10-20' } })
    const evs = await h.api('/api/events', { token: ownerTok })
    c.check('resident sees the event', evs.status === 200 && evs.data.length === 1, evs)
    c.check('no login: 401', (await h.api('/api/events')).status === 401)
    c.check('outsider sees none', (await h.api('/api/events', { token: await h.register('out@x.mn') })).data.length === 0)
    c.done()
})

test('malformed ids are rejected with 400', async () => {
    const c = checker()
    const cases = [
        ['PUT', '/api/admin/users/abc/role', adminTok, { role: 'user' }],
        ['GET', '/api/admin/users/abc', adminTok],
        ['PUT', '/api/payments/admin/abc/mark-paid', adminTok],
        ['DELETE', '/api/payments/admin/abc', adminTok],
        ['POST', '/api/payments/abc/pay', ownerTok],
        ['PUT', '/api/feedback/admin/abc/status', adminTok, { status: 'open' }],
        ['DELETE', '/api/announcements/abc', adminTok],
        ['DELETE', '/api/events/abc', adminTok],
        ['DELETE', '/api/rules/abc', adminTok],
        ['DELETE', '/api/contacts/abc', adminTok],
        ['PUT', '/api/notifications/abc/read', ownerTok],
        ['DELETE', '/api/vehicles/abc', ownerTok],
        ['PUT', '/api/addresses/abc/activate', ownerTok],
        ['PUT', '/api/addresses/admin/abc/accept', adminTok],
    ]
    for (const [method, path, token, body] of cases) {
        const r = await h.api(path, { method, token, body })
        c.check(`${method} ${path}`, r.status === 400, r.status)
    }
    c.check('well-formed but missing id: 404', (await h.api(`/api/announcements/${'a'.repeat(24)}`, { method: 'DELETE', token: adminTok })).status === 404)
    c.done()
})
