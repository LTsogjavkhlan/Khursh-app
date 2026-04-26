import express from 'express'
import {
    submitFeedback,
    getUserFeedback,
    getAllFeedback,
    respondToFeedback,
    updateFeedbackStatus
} from '../controllers/feedbackController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// User routes
router.post('/', protect, submitFeedback)
router.get('/my', protect, getUserFeedback)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllFeedback)
router.put('/admin/:id/respond', protect, adminOnly, respondToFeedback)
router.put('/admin/:id/status', protect, adminOnly, updateFeedbackStatus)

export default router
