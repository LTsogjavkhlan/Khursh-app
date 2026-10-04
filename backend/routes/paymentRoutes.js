import express from 'express'
import {
    payBill,
    getUserPayments,
    getPaymentHistory,
    getAllPayments,
    qpayCallback,
    getPaymentSettings,
    updatePaymentSettings,
    generateMonthlyBills,
    generateBillForUser,
    markPaymentAsPaid,
    deletePayment
} from '../controllers/paymentController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { requireApartmentAccess } from '../utils/tenant.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import {
    updatePaymentSettingsSchema,
    generateBillsSchema,
    generateBillForUserSchema,
    qpayCallbackSchema,
} from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Settings (authenticated read so it is scoped to the caller's HOA, admin write)
router.get('/settings', protect, getPaymentSettings)
router.put('/settings', protect, adminOnly, validate(updatePaymentSettingsSchema), updatePaymentSettings)

// User routes (require an apartment membership: owner or tenant). Residents
// can only pay bills an admin generated — they can never create a bill.
router.post('/:id/pay', protect, requireApartmentAccess, payBill)
router.get('/my-payments', protect, requireApartmentAccess, getUserPayments)
router.get('/history', protect, requireApartmentAccess, getPaymentHistory)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllPayments)
router.post('/admin/generate-bills', protect, adminOnly, validate(generateBillsSchema), generateMonthlyBills)
router.post('/admin/generate-bill-for-user', protect, adminOnly, validate(generateBillForUserSchema), generateBillForUser)
router.put('/admin/:id/mark-paid', protect, adminOnly, markPaymentAsPaid)
router.delete('/admin/:id', protect, adminOnly, deletePayment)

// QPay Webhook (public - called by QPay service)
router.post('/qpay-callback', validate(qpayCallbackSchema), qpayCallback)

export default router
