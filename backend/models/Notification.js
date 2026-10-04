import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    type: {
        type: String,
        enum: ['announcement', 'payment', 'event', 'general', 'feedback', 'maintenance'],
        default: 'general'
    },
    // null = broadcast to all users; set = personal notification for one user
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hoaName: { type: String, index: true },
    hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', index: true }
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
