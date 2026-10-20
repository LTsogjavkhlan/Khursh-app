import Feedback from '../models/Feedback.js'
import { createUserNotification } from './notificationController.js'
import { requireHoaId, docInHoa, resolveHoaId } from '../utils/tenant.js'
import { isImageStoreConfigured, sniffImageType, uploadImage, deleteImages } from '../utils/imageStore.js'
import { logger } from '../utils/logger.js'

export const submitFeedback = async (req, res) => {
    const files = req.files || []
    const uploaded = []
    try {
        const { title, description, type } = req.body
        const hoa = await resolveHoaId(req)

        if (files.length) {
            if (!isImageStoreConfigured()) {
                return res.status(503).json({ message: 'Зураг хадгалах үйлчилгээ тохируулагдаагүй байна. Зураггүйгээр илгээнэ үү.' })
            }
            // Check every file's real contents before uploading any of them
            const types = files.map(f => sniffImageType(f.buffer))
            if (types.some(t => !t)) {
                return res.status(400).json({ message: 'Зөвхөн зураг (JPEG, PNG, WebP, HEIC) хавсаргах боломжтой' })
            }
            const folder = `hoa/${hoa || 'none'}/feedback`
            for (let i = 0; i < files.length; i++) {
                uploaded.push(await uploadImage(files[i].buffer, { folder, type: types[i] }))
            }
        }

        const feedback = new Feedback({
            title,
            description,
            type,
            images: uploaded,
            user: req.userId,
            hoaName: req.userHoaName || null,
            hoa
        })

        await feedback.save()
        res.status(201).json({
            message: 'Feedback submitted',
            feedback
        })
    } catch (error) {
        // Never leave photos behind for a complaint that wasn't saved
        await deleteImages(uploaded.map(img => img.publicId))
        logger.error('feedback submit failed', { error: error.message, images: files.length })
        const isUpload = files.length && uploaded.length < files.length
        res.status(isUpload ? 502 : 500).json({
            message: isUpload ? 'Зураг хадгалахад алдаа гарлаа. Дахин оролдоно уу.' : 'Санал илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
        })
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
