import Announcement from '../models/Announcement.js'
import { requireHoaId, resolveHoaId, idEq } from '../utils/tenant.js'

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body

        const announcement = new Announcement({
            title,
            content,
            createdBy: req.userId,
            hoaName: req.userHoaName || null,
            hoa: await resolveHoaId(req)
        })

        await announcement.save()
        res.status(201).json({
            message: 'Announcement created',
            announcement
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getAnnouncements = async (req, res) => {
    try {
        // Only show announcements for the caller's HOA; no HOA => nothing to show
        const hoaId = await resolveHoaId(req)
        if (!hoaId) return res.json([])
        const announcements = await Announcement.find({ hoa: hoaId })
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
        res.json(announcements)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateAnnouncement = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        let announcement = await Announcement.findById(req.params.id)
        if (!announcement || !idEq(announcement.hoa, hoaId)) {
            return res.status(404).json({ message: 'Announcement not found' })
        }

        // Never let the HOA tag be reassigned via an update
        const { hoaName, hoa, ...safeBody } = req.body
        announcement = await Announcement.findByIdAndUpdate(req.params.id, safeBody, {
            new: true
        })

        res.json({
            message: 'Announcement updated',
            announcement
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteAnnouncement = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const existing = await Announcement.findById(req.params.id)
        if (!existing || !idEq(existing.hoa, hoaId)) {
            return res.status(404).json({ message: 'Announcement not found' })
        }
        const announcement = await Announcement.findByIdAndDelete(req.params.id)

        res.json({
            message: 'Announcement deleted',
            announcement
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
