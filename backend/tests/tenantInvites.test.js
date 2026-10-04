// Tenant invites: no account enumeration, nobody added without consent.
import { test, before, after } from 'node:test'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import Notification from '../models/Notification.js'
import TenantInvite from '../models/TenantInvite.js'

let h, adminTok, ownerTok, tenantTok, strangerTok, apt, tenantId, tInv

before(async () => {
    h = await startServer(5193)
    const hoa = await Hoa.create({ name: 'A' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoa._id, hoaName: 'A' })
    adminTok = await h.login('admin@a.mn')
    ownerTok = await h.register('owner@x.mn', { phone: '88000000', firstName: 'Bat' })
    apt = (await h.api('/api/addresses', { token: ownerTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '12' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })
    tenantTok = await h.register('tenant@x.mn', { phone: '99001122', firstName: 'Saraa' })
    strangerTok = await h.register('stranger@x.mn', { phone: '99112233', firstName: 'Evil' })
    tenantId = String((await User.findOne({ email: 'tenant@x.mn' }))._id)
})
after(() => h.stop())

const invite = (contact, token = ownerTok, aptId = apt._id) =>
    h.api(`/api/apartments/${aptId}/invites`, { token, method: 'POST', body: { contact } })

test('the old lookup and direct-add endpoints are gone', async () => {
    const c = checker()
    const lookup = await h.api('/api/apartments/lookup?identifier=tenant@x.mn', { token: strangerTok })
    c.check('lookup removed', lookup.status === 404 && !JSON.stringify(lookup.data).includes('tenant@x.mn'))
    c.check('direct add removed', (await h.api(`/api/apartments/${apt._id}/tenants`, { token: ownerTok, method: 'POST', body: { identifier: 'tenant@x.mn' } })).status === 404)
    c.done()
})

test('inviting reveals nothing about which accounts exist', async () => {
    const c = checker()
    const real = await invite('Tenant@x.mn')
    const fake = await invite('nobody@x.mn')
    const admin = await invite('admin@a.mn')
    const self = await invite('owner@x.mn')
    const same = (a, b) => a.status === b.status && JSON.stringify(a.data) === JSON.stringify(b.data)
    c.check('existing vs non-existing: identical', same(real, fake), [real, fake])
    c.check('admin account: identical', same(real, admin))
    c.check('self: identical', same(real, self))
    const mine = (await h.api('/api/apartments/mine', { token: ownerTok })).data[0]
    c.check('owner sees 4 pending invites', mine.invites.length === 4, mine.invites.length)
    c.check('owner sees only what they typed', mine.invites.every(i => Object.keys(i).sort().join() === '_id,contact,createdAt,expiresAt'), mine.invites[0])
    c.check('no tenant before acceptance', mine.tenants.length === 0)
    c.check('admin & self invites delivered to nobody', (await TenantInvite.countDocuments({ invitee: { $ne: null } })) === 1)
    c.done()
})

test('nothing happens until the invitee accepts', async () => {
    const c = checker()
    c.check('tenant has no access yet', (await h.api('/api/vehicles', { token: tenantTok })).status === 403)
    const list = (await h.api('/api/apartments/invites/mine', { token: tenantTok })).data
    tInv = list[0]
    c.check('tenant sees invite with apartment and owner name', list.length === 1 && tInv.apartment.apartmentNumber === '12' && tInv.invitedBy.firstName === 'Bat', list)
    c.check('owner email/phone not exposed', !JSON.stringify(list).includes('owner@x.mn') && !JSON.stringify(list).includes('88000000'))
    c.check('tenant notified', (await Notification.countDocuments({ recipient: tenantId, title: 'Түрээслэгчийн урилга ирлээ' })) === 1)
    c.check('stranger sees no invites', (await h.api('/api/apartments/invites/mine', { token: strangerTok })).data.length === 0)
    c.check('stranger cannot accept it', (await h.api(`/api/apartments/invites/${tInv._id}/accept`, { token: strangerTok, method: 'POST' })).status === 404)
    c.check('stranger cannot invite on the apartment', (await invite('x@x.mn', strangerTok)).status === 403)
    c.check('stranger cannot cancel the invite', (await h.api(`/api/apartments/${apt._id}/invites/${tInv._id}`, { token: strangerTok, method: 'DELETE' })).status === 403)
    c.done()
})

test('accepting makes the invitee a tenant', async () => {
    const c = checker()
    c.check('tenant accepts', (await h.api(`/api/apartments/invites/${tInv._id}/accept`, { token: tenantTok, method: 'POST' })).status === 200)
    c.check('tenant has apartment access', (await h.api('/api/vehicles', { token: tenantTok })).status === 200)
    c.check('tenant is in the HOA chat', (await h.api('/api/chat/messages', { token: tenantTok })).status === 200)
    c.check('cannot accept twice', (await h.api(`/api/apartments/invites/${tInv._id}/accept`, { token: tenantTok, method: 'POST' })).status === 404)
    const after = (await h.api('/api/apartments/mine', { token: ownerTok })).data[0]
    c.check('owner sees the tenant', after.tenants.length === 1 && after.tenants[0].user.firstName === 'Saraa')
    c.check('accepted invite left the pending list', after.invites.length === 3)
    c.check('owner notified', (await Notification.countDocuments({ title: 'Урилга хүлээн авагдлаа' })) === 1)
    c.done()
})

test('decline, cancel and phone invites', async () => {
    const c = checker()
    await invite('99112233')
    let sInv = (await h.api('/api/apartments/invites/mine', { token: strangerTok })).data
    c.check('phone invite delivered', sInv.length === 1)
    c.check('decline works', (await h.api(`/api/apartments/invites/${sInv[0]._id}/decline`, { token: strangerTok, method: 'POST' })).status === 200)
    c.check('declined: still no access', (await h.api('/api/vehicles', { token: strangerTok })).status === 403)
    c.check('declined invite cannot be accepted', (await h.api(`/api/apartments/invites/${sInv[0]._id}/accept`, { token: strangerTok, method: 'POST' })).status === 404)
    await User.create({ email: 'dup@x.mn', password: 'secret123', firstName: 'D', lastName: 'P', phone: '95000000' })
    await User.create({ email: 'dup2@x.mn', password: 'secret123', firstName: 'D', lastName: 'Q', phone: '95000000' })
    await invite('95000000')
    c.check('ambiguous phone delivered to nobody', !(await TenantInvite.findOne({ contact: '95000000' })).invitee)
    await invite('stranger@x.mn')
    sInv = (await h.api('/api/apartments/invites/mine', { token: strangerTok })).data
    c.check('owner cancels invite', (await h.api(`/api/apartments/${apt._id}/invites/${sInv[0]._id}`, { token: ownerTok, method: 'DELETE' })).status === 200)
    c.check('cancelled invite cannot be accepted', (await h.api(`/api/apartments/invites/${sInv[0]._id}/accept`, { token: strangerTok, method: 'POST' })).status === 404)
    c.done()
})

test('limits and validation', async () => {
    const c = checker()
    c.check('malformed invite id: 400', (await h.api('/api/apartments/invites/abc/accept', { token: tenantTok, method: 'POST' })).status === 400)
    c.check('malformed address id: 400', (await h.api('/api/apartments/abc/invites', { token: ownerTok, method: 'POST', body: { contact: 'a@b.mn' } })).status === 400)
    let last
    for (let i = 0; i < 12; i++) last = await invite(`spam${i}@x.mn`)
    c.check('pending invite cap: 429', last.status === 429, last.status)
    const pendTok = await h.register('pend@x.mn')
    const pendApt = (await h.api('/api/addresses', { token: pendTok, method: 'POST', body: { hoaName: 'A' } })).data
    c.check('pending apartment cannot invite', (await invite('a@b.mn', pendTok, pendApt._id)).status === 400)
    c.done()
})

test('revoking the apartment kills its pending invites and tenants', async () => {
    const c = checker()
    const lateTok = await h.register('late@x.mn')
    await TenantInvite.updateMany({ apartment: apt._id, status: 'pending' }, { status: 'cancelled' }) // free the cap
    await invite('late@x.mn')
    const lInv = (await h.api('/api/apartments/invites/mine', { token: lateTok })).data
    await h.api(`/api/addresses/admin/${apt._id}/cancel`, { token: adminTok, method: 'PUT' })
    c.check('invite gone', (await h.api('/api/apartments/invites/mine', { token: lateTok })).data.length === 0)
    c.check('accept fails', (await h.api(`/api/apartments/invites/${lInv[0]._id}/accept`, { token: lateTok, method: 'POST' })).status === 404)
    c.check('existing tenant lost access', (await h.api('/api/vehicles', { token: tenantTok })).status === 403)
    c.done()
})
