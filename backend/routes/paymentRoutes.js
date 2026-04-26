import express from 'express'
import {
    requestPayment,
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

const router = express.Router()

// Settings (public read, admin write)
router.get('/settings', getPaymentSettings)
router.put('/settings', protect, adminOnly, updatePaymentSettings)

// User routes
router.post('/request', protect, requestPayment)
router.get('/my-payments', protect, getUserPayments)
router.get('/history', protect, getPaymentHistory)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllPayments)
router.post('/admin/generate-bills', protect, adminOnly, generateMonthlyBills)
router.post('/admin/generate-bill-for-user', protect, adminOnly, generateBillForUser)
router.put('/admin/:id/mark-paid', protect, adminOnly, markPaymentAsPaid)
router.delete('/admin/:id', protect, adminOnly, deletePayment)

// QPay Webhook (public - called by QPay service)
router.post('/qpay-callback', qpayCallback)

export default router
