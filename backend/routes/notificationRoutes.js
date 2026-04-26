import express from 'express'
import {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from '../controllers/notificationController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.get('/',              protect,            getNotifications)
router.get('/unread-count',  protect,            getUnreadCount)
router.put('/read-all',      protect,            markAllAsRead)
router.put('/:id/read',      protect,            markAsRead)
router.post('/',             protect, adminOnly, createNotification)

export default router
