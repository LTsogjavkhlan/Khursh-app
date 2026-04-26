import express from 'express'
import {
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getEvents)

// Admin routes
router.post('/', protect, adminOnly, createEvent)
router.put('/:id', protect, adminOnly, updateEvent)
router.delete('/:id', protect, adminOnly, deleteEvent)

export default router
