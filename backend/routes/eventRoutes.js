import express from 'express'
import {
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { createEventSchema, updateEventSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Public routes
router.get('/', protect, getEvents)

// Admin routes
router.post('/', protect, adminOnly, validate(createEventSchema), createEvent)
router.put('/:id', protect, adminOnly, validate(updateEventSchema), updateEvent)
router.delete('/:id', protect, adminOnly, deleteEvent)

export default router
