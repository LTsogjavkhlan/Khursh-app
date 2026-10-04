import express from 'express'
import {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from '../controllers/notificationController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { createNotificationSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

router.get('/',              protect,            getNotifications)
router.get('/unread-count',  protect,            getUnreadCount)
router.put('/read-all',      protect,            markAllAsRead)
router.put('/:id/read',      protect,            markAsRead)
router.post('/',             protect, adminOnly, validate(createNotificationSchema), createNotification)

export default router
