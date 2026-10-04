import Payment from '../models/Payment.js'
import PaymentSettings from '../models/PaymentSettings.js'
import User from '../models/User.js'
import ApartmentMember from '../models/ApartmentMember.js'
import { createUserNotification } from './notificationController.js'
import { requireHoaId, docInHoa, resolveHoaId, idEq } from '../utils/tenant.js'
import { isQPayConfigured, checkInvoicePayment } from '../utils/qpay.js'
import { logger } from '../utils/logger.js'

// Owner ids whose bills the caller may see/pay: the caller themselves plus the
// OWNER of every apartment the caller is a member of (so tenants see the
// owner's shared HOA bills). Resolved live so access is immediate.
const resolveVisibleOwnerIds = async (userId) => {
    const memberships = await ApartmentMember.find({ user: userId }).select('apartment').lean()
    const ids = new Set([String(userId)])
    const apartmentIds = memberships.map(m => m.apartment)
    if (apartmentIds.length) {
        const owners = await ApartmentMember.find({ apartment: { $in: apartmentIds }, role: 'OWNER' }).select('user').lean()
        owners.forEach(o => ids.add(String(o.user)))
    }
    return [...ids]
}

// Placeholder function to generate QPay deeplink
const generateQPayDeeplink = async (paymentData) => {
    try {
        // TODO: Replace with actual QPay API call
        // For now, returning placeholder deeplink
        const deeplink = `qpay://invoice?invoiceId=${paymentData._id}&amount=${paymentData.amount}`
        return deeplink
    } catch (error) {
        console.error('QPay error:', error)
        throw error
    }
}

// Pay an existing bill by id. Any member (owner or tenant) of the bill owner's
// apartment may pay it; the bill stays owned by the original owner.
export const payBill = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
        if (!payment) {
            return res.status(404).json({ message: 'Төлбөр олдсонгүй' })
        }

        const ownerIds = await resolveVisibleOwnerIds(req.userId)
        if (!ownerIds.includes(String(payment.user))) {
            return res.status(403).json({ message: 'Энэ төлбөрийг төлөх эрхгүй байна' })
        }

        if (payment.status === 'completed') {
            return res.status(400).json({ message: 'Энэ төлбөр аль хэдийн төлөгдсөн байна' })
        }

        payment.status = 'processing'
        payment.qpayDeeplink = await generateQPayDeeplink(payment)
        await payment.save()

        res.json({
            message: 'Төлбөрийн хүсэлт үүсгэгдлээ',
            payment: {
                id: payment._id,
                amount: payment.amount,
                month: payment.month,
                status: payment.status,
                deeplink: payment.qpayDeeplink
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUserPayments = async (req, res) => {
    try {
        const ownerIds = await resolveVisibleOwnerIds(req.userId)
        const payments = await Payment.find({ user: { $in: ownerIds } })
            .sort({ createdAt: -1 })

        res.json(payments)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getPaymentHistory = async (req, res) => {
    try {
        const ownerIds = await resolveVisibleOwnerIds(req.userId)
        const payments = await Payment.find({
            user: { $in: ownerIds },
            status: 'completed'
        }).sort({ paidAt: -1 })

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

        res.json({
            payments,
            summary: {
                totalPaid,
                paymentsCount: payments.length
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin: View all payments
export const getAllPayments = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const payments = await Payment.find({ hoa: hoaId })
            .populate('user', 'firstName lastName email phone building entrance floor apartmentNumber')
            .sort({ createdAt: -1 })

        const stats = {
            total: payments.length,
            completed: payments.filter(p => p.status === 'completed').length,
            pending: payments.filter(p => p.status === 'pending').length,
            totalAmount: payments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0)
        }

        res.json({ payments, stats })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getPaymentSettings = async (req, res) => {
    try {
        // Users not attached to an HOA get safe defaults rather than another HOA's settings
        const hoaId = await resolveHoaId(req)
        if (!hoaId) {
            return res.json({ monthlyFee: 50000, dueDay: 15, hoaName: null })
        }
        let settings = await PaymentSettings.findOne({ hoa: hoaId })
        if (!settings) {
            settings = await PaymentSettings.create({ monthlyFee: 50000, dueDay: 15, hoaName: req.userHoaName || null, hoa: hoaId })
        }
        res.json(settings)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updatePaymentSettings = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { monthlyFee, dueDay, description } = req.body
        let settings = await PaymentSettings.findOne({ hoa: hoaId })
        if (!settings) {
            settings = new PaymentSettings({ hoaName: req.userHoaName || null, hoa: hoaId })
        }
        if (monthlyFee !== undefined) settings.monthlyFee = monthlyFee
        if (dueDay !== undefined) settings.dueDay = dueDay
        if (description !== undefined) settings.description = description
        settings.updatedBy = req.userId
        await settings.save()
        res.json({ message: 'Settings updated', settings })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const generateMonthlyBills = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { month } = req.body
        if (!month) {
            return res.status(400).json({ message: 'Month is required (e.g. "2025-03")' })
        }

        const settings = await PaymentSettings.findOne({ hoa: hoaId })
        const amount = settings?.monthlyFee || 50000

        // Bill apartment owners only. Tenants never get their own bill — they see
        // and pay the owner's bill (see resolveVisibleOwnerIds). OWNER
        // memberships exist only for admin-approved apartments.
        const ownerIds = await ApartmentMember.distinct('user', { hoa: hoaId, role: 'OWNER' })
        const users = await User.find({ _id: { $in: ownerIds }, role: 'user' }).select('_id')

        // Fetch all existing bills for this month in ONE query (avoids N+1)
        const userIds = users.map(u => u._id)
        const existing = await Payment.find({ user: { $in: userIds }, month }).select('user')
        const alreadyBilled = new Set(existing.map(p => p.user.toString()))

        const description = settings?.description || 'СӨХ-ийн сарын хураамж'
        const toCreate = users
            .filter(u => !alreadyBilled.has(u._id.toString()))
            .map(u => ({
                user: u._id,
                amount,
                month,
                hoaName: req.userHoaName || null,
                hoa: hoaId,
                description,
                status: 'pending'
            }))

        if (toCreate.length > 0) {
            await Payment.insertMany(toCreate)
        }

        const results = { created: toCreate.length, skipped: users.length - toCreate.length }
        res.json({ message: `${month} сарын төлбөр үүсгэгдлээ`, ...results })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin: Generate a bill for a single specific user
export const generateBillForUser = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { userId, month } = req.body
        if (!userId || !month) {
            return res.status(400).json({ message: 'userId and month are required' })
        }

        const user = await User.findById(userId)
        const ownsHere = user && await ApartmentMember.exists({ user: user._id, hoa: hoaId, role: 'OWNER' })
        if (!user || !(ownsHere || idEq(user.hoa, hoaId))) {
            return res.status(404).json({ message: 'User not found' })
        }
        // Same rule as the monthly run: only approved apartment owners are billed
        if (!ownsHere) {
            return res.status(400).json({ message: 'Зөвхөн баталгаажсан орон сууцны эзэмшигчид төлбөр үүсгэх боломжтой' })
        }

        const existing = await Payment.findOne({ user: userId, month })
        if (existing) {
            return res.status(400).json({ message: `${month} сарын төлбөр энэ хэрэглэгчид аль хэдийн үүссэн байна` })
        }

        const settings = await PaymentSettings.findOne({ hoa: hoaId })
        const amount = settings?.monthlyFee || 50000

        const payment = await Payment.create({
            user: userId,
            amount,
            month,
            hoaName: req.userHoaName || null,
            hoa: hoaId,
            description: settings?.description || 'СӨХ-ийн сарын хураамж',
            status: 'pending'
        })

        const populated = await Payment.findById(payment._id)
            .populate('user', 'firstName lastName email building entrance floor apartmentNumber')

        res.status(201).json({ message: `${month} сарын төлбөр үүсгэгдлээ`, payment: populated })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin: Mark a payment as paid (cash / manual)
export const markPaymentAsPaid = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const payment = await Payment.findById(req.params.id).populate('user', 'firstName lastName building entrance floor apartmentNumber hoaName')
        if (!payment || !(await docInHoa(payment, hoaId))) {
            return res.status(404).json({ message: 'Payment not found' })
        }
        payment.status = 'completed'
        payment.paidAt = new Date()
        await payment.save()

        // Notify the user their payment has been confirmed
        try {
            const monthLabel = payment.month ? ` (${payment.month})` : ''
            await createUserNotification({
                recipientId: payment.user._id,
                title: 'Төлбөр баталгаажлаа ✅',
                message: `Таны ${Number(payment.amount).toLocaleString('mn-MN')}₮ сарын хураамж${monthLabel} амжилттай бүртгэгдлээ.`,
                type: 'payment',
                createdBy: req.userId
            })
        } catch { /* notification failure should not block the response */ }

        res.json({ message: 'Төлбөр төлсөн гэж тэмдэглэгдлээ', payment })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin: Delete a payment record
export const deletePayment = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const payment = await Payment.findById(req.params.id)
        if (!payment || !(await docInHoa(payment, hoaId))) {
            return res.status(404).json({ message: 'Payment not found' })
        }
        await Payment.findByIdAndDelete(req.params.id)
        res.json({ message: 'Төлбөр устгагдлаа' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// QPay Webhook - Called by QPay after payment.
// This endpoint is public, so the request is treated purely as a "go check"
// signal: the payment is only marked completed after QPay's own API confirms
// the invoice was paid in full. Nothing in the request body is trusted.
export const qpayCallback = async (req, res) => {
    try {
        if (!isQPayConfigured()) {
            return res.status(503).json({ message: 'QPay is not configured' })
        }

        // invoiceId is our payment._id (validated as an ObjectId by the route schema)
        const payment = await Payment.findById(req.body.invoiceId)
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' })
        }

        if (payment.status === 'completed') {
            return res.json({ status: payment.status })
        }

        // Without a QPay invoice on record there is nothing to verify against
        if (!payment.qpayInvoiceId) {
            return res.status(409).json({ message: 'Payment has no QPay invoice' })
        }

        let check
        try {
            check = await checkInvoicePayment(payment.qpayInvoiceId)
        } catch (err) {
            logger.error('QPay payment check failed', { paymentId: String(payment._id), error: err.message })
            return res.status(502).json({ message: 'Could not verify payment with QPay' })
        }

        if (check.paidAmount < payment.amount) {
            return res.json({ status: payment.status })
        }

        payment.status = 'completed'
        payment.qpayTransactionId = check.paymentId
        payment.paidAt = new Date()
        await payment.save()

        // Notify the user their payment went through
        try {
            const monthLabel = payment.month ? ` (${payment.month})` : ''
            await createUserNotification({
                recipientId: payment.user,
                title: 'Төлбөр амжилттай төлөгдлөө ✅',
                message: `Таны ${Number(payment.amount).toLocaleString('mn-MN')}₮ сарын хураамж${monthLabel} QPay-р амжилттай төлөгдлөө.`,
                type: 'payment'
            })
        } catch { /* ignore */ }

        res.json({ status: payment.status })
    } catch (error) {
        logger.error('QPay callback error', { error: error.message })
        res.status(500).json({ message: 'Internal server error' })
    }
}
