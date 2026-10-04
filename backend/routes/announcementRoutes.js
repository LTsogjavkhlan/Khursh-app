import express from 'express'
import {
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { createAnnouncementSchema, updateAnnouncementSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Protected — users see their own HOA's announcements
router.get('/', protect, getAnnouncements)

// Admin routes
router.post('/', protect, adminOnly, validate(createAnnouncementSchema), createAnnouncement)
router.put('/:id', protect, adminOnly, validate(updateAnnouncementSchema), updateAnnouncement)
router.delete('/:id', protect, adminOnly, deleteAnnouncement)

export default router
