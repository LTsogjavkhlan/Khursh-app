import express from 'express'
import {
    submitFeedback,
    getUserFeedback,
    getAllFeedback,
    respondToFeedback,
    updateFeedbackStatus
} from '../controllers/feedbackController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import {
    submitFeedbackSchema,
    respondFeedbackSchema,
    feedbackStatusSchema,
} from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// User routes
router.post('/', protect, validate(submitFeedbackSchema), submitFeedback)
router.get('/my', protect, getUserFeedback)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllFeedback)
router.put('/admin/:id/respond', protect, adminOnly, validate(respondFeedbackSchema), respondToFeedback)
router.put('/admin/:id/status', protect, adminOnly, validate(feedbackStatusSchema), updateFeedbackStatus)

export default router
