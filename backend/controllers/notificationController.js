import Notification from '../models/Notification.js'
import Announcement from '../models/Announcement.js'

// Internal helper — called by other controllers to create personal notifications
export async function createUserNotification({ recipientId, title, message, type = 'general', createdBy = null, hoaName = null }) {
    return Notification.create({
        title,
        message,
        type,
        recipient: recipientId,
        createdBy,
        hoaName,
        readBy: []
    })
}

export const createNotification = async (req, res) => {
    try {
        const { title, message, type } = req.body

        const notification = new Notification({
            title,
            message,
            type: type || 'general',
            recipient: null, // broadcast to HOA members
            createdBy: req.userId,
            hoaName: req.userHoaName || null,
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
        const broadcastFilter = req.userHoaName
            ? { recipient: null, hoaName: req.userHoaName }
            : { recipient: null }
        const notifications = await Notification.find({
            $or: [
                broadcastFilter,
                { recipient: req.userId }
            ]
        })
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
        const broadcastFilter = req.userHoaName
            ? { recipient: null, hoaName: req.userHoaName }
            : { recipient: null }
        const count = await Notification.countDocuments({
            $or: [
                broadcastFilter,
                { recipient: req.userId }
            ],
            readBy: { $ne: req.userId }
        })
        res.json({ count })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
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
        const broadcastFilter = req.userHoaName
            ? { recipient: null, hoaName: req.userHoaName }
            : { recipient: null }
        await Notification.updateMany(
            {
                $or: [broadcastFilter, { recipient: req.userId }],
                readBy: { $ne: req.userId }
            },
            { $addToSet: { readBy: req.userId } }
        )
        res.json({ message: 'All marked as read' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
