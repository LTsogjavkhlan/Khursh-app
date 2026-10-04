// Billing: residents can't create bills; only approved apartment owners are billed.
import { test, before, after } from 'node:test'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import Payment from '../models/Payment.js'

let h, adminTok, ownerTok, tenantTok, ownerId, tenantId, pendId

before(async () => {
    h = await startServer(5194)
    const hoa = await Hoa.create({ name: 'A' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoa._id, hoaName: 'A' })
    adminTok = await h.login('admin@a.mn')

    ownerTok = await h.register('owner@x.mn')
    const apt = (await h.api('/api/addresses', { token: ownerTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '1' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })

    tenantTok = await h.register('tenant@x.mn')
    await h.api(`/api/apartments/${apt._id}/invites`, { token: ownerTok, method: 'POST', body: { contact: 'tenant@x.mn' } })
    const inv = (await h.api('/api/apartments/invites/mine', { token: tenantTok })).data[0]
    await h.api(`/api/apartments/invites/${inv._id}/accept`, { token: tenantTok, method: 'POST' })

    const pendTok = await h.register('pending@x.mn')
    await h.api('/api/auth/request-membership', { token: pendTok, method: 'POST', body: { hoaName: 'A' } })

    ownerId = String((await User.findOne({ email: 'owner@x.mn' }))._id)
    tenantId = String((await User.findOne({ email: 'tenant@x.mn' }))._id)
    pendId = String((await User.findOne({ email: 'pending@x.mn' }))._id)
})
after(() => h.stop())

test('residents cannot create bills', async () => {
    const c = checker()
    const forged = await h.api('/api/payments/request', { token: ownerTok, method: 'POST', body: { amount: 1, month: '2026-10', description: 'fake' } })
    c.check('POST /payments/request is gone', forged.status === 404, forged.status)
    c.check('no payment created', (await Payment.countDocuments()) === 0)
    c.done()
})

test('monthly run bills owners only', async () => {
    const c = checker()
    const gen = await h.api('/api/payments/admin/generate-bills', { token: adminTok, method: 'POST', body: { month: '2026-10' } })
    c.check('one bill for the apartment', gen.status === 200 && gen.data.created === 1, gen.data)
    c.check('owner billed', await Payment.exists({ user: ownerId, month: '2026-10' }))
    c.check('tenant not billed', !(await Payment.exists({ user: tenantId })))
    c.check('pending user not billed', !(await Payment.exists({ user: pendId })))
    const ownerBills = (await h.api('/api/payments/my-payments', { token: ownerTok })).data
    c.check('owner sees the admin-set amount', ownerBills.length === 1 && ownerBills[0].amount === 50000)
    const tenantBills = (await h.api('/api/payments/my-payments', { token: tenantTok })).data
    c.check('tenant sees the owner\'s bill', tenantBills.length === 1 && String(tenantBills[0].user) === ownerId)
    const pay = await h.api(`/api/payments/${ownerBills[0]._id}/pay`, { token: tenantTok, method: 'POST' })
    c.check('tenant can pay the owner\'s bill', pay.status === 200 && pay.data.payment.amount === 50000)
    c.done()
})

test('single-user bill follows the same rule', async () => {
    const c = checker()
    const bill = (userId) => h.api('/api/payments/admin/generate-bill-for-user', { token: adminTok, method: 'POST', body: { userId, month: '2026-11' } })
    c.check('tenant: 400', (await bill(tenantId)).status === 400)
    c.check('pending user: 400', (await bill(pendId)).status === 400)
    c.check('owner: 201', (await bill(ownerId)).status === 201)
    c.done()
})
