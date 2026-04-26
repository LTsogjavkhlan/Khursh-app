import express from 'express'
import {
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Protected — users see their own HOA's announcements
router.get('/', protect, getAnnouncements)

// Admin routes
router.post('/', protect, adminOnly, createAnnouncement)
router.put('/:id', protect, adminOnly, updateAnnouncement)
router.delete('/:id', protect, adminOnly, deleteAnnouncement)

export default router
