import Announcement from '../models/Announcement.js'

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body

        const announcement = new Announcement({
            title,
            content,
            createdBy: req.userId,
            hoaName: req.userHoaName || null
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
        const filter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
        res.json(announcements)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateAnnouncement = async (req, res) => {
    try {
        let announcement = await Announcement.findById(req.params.id)
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' })
        }

        announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
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
        const announcement = await Announcement.findByIdAndDelete(req.params.id)
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' })
        }

        res.json({
            message: 'Announcement deleted',
            announcement
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
