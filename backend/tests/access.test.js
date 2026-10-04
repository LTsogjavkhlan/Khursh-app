// HOA access control (membership must be approved) and the QPay callback.
import { test, before, after } from 'node:test'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import Payment from '../models/Payment.js'
import ApartmentMember from '../models/ApartmentMember.js'

let h, hoaA, adminTok, evilTok, addr, evilId

before(async () => {
    h = await startServer(5191)
    hoaA = await Hoa.create({ name: 'A' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoaA._id, hoaName: 'A' })
    adminTok = await h.login('admin@a.mn')
    await h.api('/api/chat/messages', { token: adminTok, method: 'POST', body: { content: 'private HOA A message' } })
})
after(() => h.stop())

test('self-assigned HOA at sign-up grants nothing', async () => {
    const c = checker()
    evilTok = await h.register('evil@x.mn', { hoaName: 'A' })
    c.check('register ignores hoaName', !(await User.findOne({ email: 'evil@x.mn' })).hoa)
    c.check('chat history blocked', (await h.api('/api/chat/messages', { token: evilTok })).status === 403)
    c.check('socket rejected', (await h.socketResult(evilTok)).startsWith('rejected'))
    c.done()
})

test('pending membership request grants nothing', async () => {
    const c = checker()
    const hoaCount = await Hoa.countDocuments()
    c.check('unknown HOA rejected', (await h.api('/api/auth/request-membership', { token: evilTok, method: 'POST', body: { hoaName: 'Junk HOA' } })).status === 400)
    c.check('no junk HOA created', (await Hoa.countDocuments()) === hoaCount)
    c.check('request for real HOA ok', (await h.api('/api/auth/request-membership', { token: evilTok, method: 'POST', body: { hoaName: 'A' } })).status === 200)
    evilTok = (await h.api('/api/auth/me', { token: evilTok })).data.token
    c.check('chat blocked', (await h.api('/api/chat/messages', { token: evilTok })).status === 403)
    c.check('chat post blocked', (await h.api('/api/chat/messages', { token: evilTok, method: 'POST', body: { content: 'hi' } })).status === 403)
    c.check('announcements empty', (await h.api('/api/announcements', { token: evilTok })).data?.length === 0)
    c.check('socket rejected', (await h.socketResult(evilTok)).startsWith('rejected'))
    c.done()
})

test('pending address request grants no apartment access', async () => {
    const c = checker()
    const res = await h.api('/api/addresses', { token: evilTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '12' } })
    addr = res.data
    evilId = (await User.findOne({ email: 'evil@x.mn' }))._id
    c.check('address created', res.status === 201, res.data)
    c.check('no OWNER membership while pending', (await ApartmentMember.countDocuments({ user: evilId })) === 0)
    c.check('vehicles blocked', (await h.api('/api/vehicles', { token: evilTok })).status === 403)
    c.done()
})

test('approval grants access; rejection revokes it immediately', async () => {
    const c = checker()
    c.check('admin accepts', (await h.api(`/api/addresses/admin/${addr._id}/accept`, { token: adminTok, method: 'PUT' })).status === 200)
    const msgs = await h.api('/api/chat/messages', { token: evilTok })
    c.check('approved: chat allowed', msgs.status === 200 && msgs.data.messages.length === 1)
    c.check('approved: vehicles allowed', (await h.api('/api/vehicles', { token: evilTok })).status === 200)
    c.check('approved: socket connects', (await h.socketResult(evilTok)) === 'connected')
    c.check('admin rejects', (await h.api(`/api/admin/memberships/${evilId}/reject`, { token: adminTok, method: 'PUT' })).status === 200)
    c.check('rejected: chat blocked with the same token', (await h.api('/api/chat/messages', { token: evilTok })).status === 403)
    c.check('rejected: socket rejected', (await h.socketResult(evilTok)).startsWith('rejected'))
    c.done()
})

test('an HOA admin cannot move into another HOA', async () => {
    const c = checker()
    await Hoa.create({ name: 'B' })
    c.check('profile hoaName rejected', (await h.api('/api/auth/profile', { token: adminTok, method: 'PUT', body: { hoaName: 'B' } })).status === 400)
    c.check('admin still in A', String((await User.findOne({ email: 'admin@a.mn' })).hoa) === String(hoaA._id))
    c.check('cannot request membership', (await h.api('/api/auth/request-membership', { token: adminTok, method: 'POST', body: { hoaName: 'B' } })).status === 403)
    c.check('cannot create address', (await h.api('/api/addresses', { token: adminTok, method: 'POST', body: { hoaName: 'B' } })).status === 403)
    c.check('normal profile edit still works', (await h.api('/api/auth/profile', { token: adminTok, method: 'PUT', body: { firstName: 'New' } })).status === 200)
    c.done()
})

test('role changes take effect on the existing token', async () => {
    const c = checker()
    await User.updateOne({ email: 'admin@a.mn' }, { role: 'user' })
    c.check('demoted admin loses admin routes', (await h.api('/api/admin/users', { token: adminTok })).status === 403)
    await User.updateOne({ email: 'admin@a.mn' }, { role: 'admin' })
    c.done()
})

test('a forged QPay callback cannot mark a bill paid', async () => {
    const c = checker()
    const bill = await Payment.create({ user: evilId, amount: 50000, hoa: hoaA._id, status: 'pending' })
    const forged = await h.api('/api/payments/qpay-callback', { method: 'POST', body: { invoiceId: String(bill._id), status: 'PAID', transactionId: 'x' } })
    c.check('unconfigured: 503', forged.status === 503, forged.status)
    c.check('bill still pending', (await Payment.findById(bill._id)).status === 'pending')
    process.env.QPAY_CLIENT_ID = 'id'
    process.env.QPAY_CLIENT_SECRET = 'secret'
    const forged2 = await h.api('/api/payments/qpay-callback', { method: 'POST', body: { invoiceId: String(bill._id), status: 'PAID' } })
    c.check('no QPay invoice on record: 409', forged2.status === 409, forged2.status)
    c.check('response does not leak the payment', !forged2.data?.payment)
    c.check('bill still pending after configured callback', (await Payment.findById(bill._id)).status === 'pending')
    c.check('malformed id: 400', (await h.api('/api/payments/qpay-callback', { method: 'POST', body: { invoiceId: 'abc' } })).status === 400)
    process.env.QPAY_CLIENT_ID = ''
    process.env.QPAY_CLIENT_SECRET = ''
    c.done()
})
