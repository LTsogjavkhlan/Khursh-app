import Feedback from '../models/Feedback.js'
import { createUserNotification } from './notificationController.js'
import { requireHoaId, docInHoa, resolveHoaId } from '../utils/tenant.js'

export const submitFeedback = async (req, res) => {
    try {
        const { title, description, type } = req.body

        const feedback = new Feedback({
            title,
            description,
            type,
            user: req.userId,
            hoaName: req.userHoaName || null,
            hoa: await resolveHoaId(req)
        })

        await feedback.save()
        res.status(201).json({
            message: 'Feedback submitted',
            feedback
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUserFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ user: req.userId })
            .populate('user', 'firstName lastName email building entrance floor apartmentNumber')
            .populate('respondedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Admin endpoints
export const getAllFeedback = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const feedback = await Feedback.find({ hoa: hoaId })
            .populate('user', 'firstName lastName email building entrance floor apartmentNumber')
            .populate('respondedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const respondToFeedback = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { adminResponse } = req.body

        const existing = await Feedback.findById(req.params.id)
        if (!existing || !(await docInHoa(existing, hoaId))) {
            return res.status(404).json({ message: 'Feedback not found' })
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                adminResponse,
                respondedBy: req.userId,
                status: 'in_progress'
            },
            { new: true }
        ).populate('user', 'firstName lastName')

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' })
        }

        // Notify the user that their feedback received a reply
        try {
            await createUserNotification({
                recipientId: feedback.user._id,
                title: 'Таны саналд хариу ирлээ',
                message: `"${feedback.title}" саналд администратор хариулсан байна.`,
                type: 'feedback',
                createdBy: req.userId
            })
        } catch { /* notification failure should not block the response */ }

        res.json({
            message: 'Response added to feedback',
            feedback
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateFeedbackStatus = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const { status } = req.body

        const existing = await Feedback.findById(req.params.id)
        if (!existing || !(await docInHoa(existing, hoaId))) {
            return res.status(404).json({ message: 'Feedback not found' })
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' })
        }

        res.json({
            message: 'Feedback status updated',
            feedback
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
