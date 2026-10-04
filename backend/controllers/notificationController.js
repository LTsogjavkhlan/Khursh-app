import Notification from '../models/Notification.js'
import Announcement from '../models/Announcement.js'
import { requireHoaId, resolveHoaId } from '../utils/tenant.js'

// Build the visibility filter for a user: their personal notifications, plus
// HOA-wide broadcasts ONLY when the user belongs to an HOA. Users with no HOA
// must never see another HOA's broadcasts.
const buildVisibilityOr = async (req) => {
    const or = [{ recipient: req.userId }]
    const hoaId = await resolveHoaId(req)
    if (hoaId) {
        or.unshift({ recipient: null, hoa: hoaId })
    }
    return or
}

// Internal helper — called by other controllers to create personal notifications
export async function createUserNotification({ recipientId, title, message, type = 'general', createdBy = null, hoaName = null, hoa = null }) {
    return Notification.create({
        title,
        message,
        type,
        recipient: recipientId,
        createdBy,
        hoaName,
        hoa,
        readBy: []
    })
}

export const createNotification = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { title, message, type } = req.body

        const notification = new Notification({
            title,
            message,
            type: type || 'general',
            recipient: null,
            createdBy: req.userId,
            hoaName: req.userHoaName || null,
            hoa: hoaId,
            readBy: []
        })

        await notification.save()

        // Mirror every broadcast as an Announcement so it shows in the Зарлал page
        try {
            await Announcement.create({
                title: notification.title,
                content: message,
                createdBy: req.userId,
                hoaName: req.userHoaName || null,
                hoa: hoaId,
            })
        } catch { /* announcement creation failure should not block the response */ }

        res.status(201).json({ message: 'Notification sent', notification })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getNotifications = async (req, res) => {
    try {
        // Return HOA-scoped broadcast notifications AND personal ones for this user
        const notifications = await Notification.find({ $or: await buildVisibilityOr(req) })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'firstName lastName')

        const userId = req.userId.toString()
        const withReadStatus = notifications.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.map(id => id.toString()).includes(userId)
        }))

        res.json(withReadStatus)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            $or: await buildVisibilityOr(req),
            readBy: { $ne: req.userId }
        })
        res.json({ count })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const markAsRead = async (req, res) => {
    try {
        // Only allow marking a notification the user is actually allowed to see
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, $or: await buildVisibilityOr(req) },
            { $addToSet: { readBy: req.userId } },
            { new: true }
        )

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' })
        }

        res.json({ message: 'Marked as read' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: await buildVisibilityOr(req),
                readBy: { $ne: req.userId }
            },
            { $addToSet: { readBy: req.userId } }
        )
        res.json({ message: 'All marked as read' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
