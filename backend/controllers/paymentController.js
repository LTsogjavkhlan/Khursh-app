import Payment from '../models/Payment.js'
import PaymentSettings from '../models/PaymentSettings.js'
import User from '../models/User.js'
import { createUserNotification } from './notificationController.js'

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

export const requestPayment = async (req, res) => {
    try {
        const { amount, month, description } = req.body

        // Check if payment already exists for this month
        if (month) {
            const existingPayment = await Payment.findOne({
                user: req.userId,
                month,
                status: { $in: ['completed', 'processing'] }
            })

            if (existingPayment) {
                return res.status(400).json({ message: 'Payment already made for this month' })
            }
        }

        const payment = new Payment({
            user: req.userId,
            amount,
            month,
            description: description || 'HOA Monthly Fee',
            status: 'pending'
        })

        await payment.save()

        // Generate QPay deeplink (placeholder)
        const deeplink = await generateQPayDeeplink(payment)
        payment.qpayDeeplink = deeplink
        await payment.save()

        res.status(201).json({
            message: 'Payment request created',
            payment: {
                id: payment._id,
                amount: payment.amount,
                month: payment.month,
                status: payment.status,
                deeplink: payment.qpayDeeplink,
                createdAt: payment.createdAt
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUserPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.userId })
            .sort({ createdAt: -1 })

        res.json(payments)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({
            user: req.userId,
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
        let filter = {}
        if (req.userHoaName) {
            // Get user IDs belonging to this HOA for backward-compat with payments that have no hoaName
            const hoaUsers = await User.find({ hoaName: req.userHoaName }).select('_id')
            const hoaUserIds = hoaUsers.map(u => u._id)
            filter = hoaUserIds.length > 0
                ? { $or: [{ hoaName: req.userHoaName }, { user: { $in: hoaUserIds } }] }
                : { hoaName: req.userHoaName }
        }
        const payments = await Payment.find(filter)
            .populate('user', 'firstName lastName email building entrance floor apartmentNumber')
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
        const hoaFilter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        let settings = await PaymentSettings.findOne(hoaFilter)
        if (!settings) {
            settings = await PaymentSettings.create({ monthlyFee: 50000, dueDay: 15, hoaName: req.userHoaName || null })
        }
        res.json(settings)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updatePaymentSettings = async (req, res) => {
    try {
        const { monthlyFee, dueDay, description } = req.body
        const hoaFilter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        let settings = await PaymentSettings.findOne(hoaFilter)
        if (!settings) {
            settings = new PaymentSettings({ hoaName: req.userHoaName || null })
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
        const { month } = req.body
        if (!month) {
            return res.status(400).json({ message: 'Month is required (e.g. "2025-03")' })
        }

        const hoaFilter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        const settings = await PaymentSettings.findOne(hoaFilter)
        const amount = settings?.monthlyFee || 50000

        // Only generate bills for users belonging to this admin's HOA
        const userFilter = req.userHoaName
            ? { role: 'user', hoaName: req.userHoaName }
            : { role: 'user' }
        const users = await User.find(userFilter)

        const results = { created: 0, skipped: 0 }

        for (const user of users) {
            const existing = await Payment.findOne({ user: user._id, month })
            if (existing) {
                results.skipped++
                continue
            }
            await Payment.create({
                user: user._id,
                amount,
                month,
                hoaName: req.userHoaName || null,
                description: settings?.description || 'СӨХ-ийн сарын хураамж',
                status: 'pending'
            })
            results.created++
        }

        res.json({ message: `${month} сарын төлбөр үүсгэгдлээ`, ...results })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin: Generate a bill for a single specific user
export const generateBillForUser = async (req, res) => {
    try {
        const { userId, month } = req.body
        if (!userId || !month) {
            return res.status(400).json({ message: 'userId and month are required' })
        }

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const existing = await Payment.findOne({ user: userId, month })
        if (existing) {
            return res.status(400).json({ message: `${month} сарын төлбөр энэ хэрэглэгчид аль хэдийн үүссэн байна` })
        }

        const hoaFilter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        const settings = await PaymentSettings.findOne(hoaFilter)
        const amount = settings?.monthlyFee || 50000

        const payment = await Payment.create({
            user: userId,
            amount,
            month,
            hoaName: req.userHoaName || null,
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
        const payment = await Payment.findById(req.params.id).populate('user', 'firstName lastName building entrance floor apartmentNumber')
        if (!payment) {
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
        const payment = await Payment.findByIdAndDelete(req.params.id)
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' })
        }
        res.json({ message: 'Төлбөр устгагдлаа' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// QPay Webhook - Called by QPay after payment
export const qpayCallback = async (req, res) => {
    try {
        const { invoiceId, status, transactionId } = req.body

        // Find payment by invoice ID (which is our payment._id)
        const payment = await Payment.findById(invoiceId)
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' })
        }

        if (status === 'PAID' || status === 'completed') {
            payment.status = 'completed'
            payment.qpayTransactionId = transactionId
            payment.paidAt = new Date()

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
        } else if (status === 'FAILED' || status === 'failed') {
            payment.status = 'failed'
        }

        await payment.save()

        res.json({
            message: 'Payment status updated',
            payment
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
