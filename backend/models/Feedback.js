import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['complaint', 'suggestion', 'maintenance', 'other'],
            default: 'other'
        },
        // Reference to the user who submitted the feedback
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved'],
            default: 'open'
        },
        adminResponse: {
            type: String
        },
        // Admin user who responded to the feedback (optional)
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // Photos attached by the resident (stored in Cloudinary, max 3)
        images: {
            type: [{
                _id: false,
                url: { type: String, required: true },
                thumbUrl: String,
                publicId: { type: String, required: true },
                width: Number,
                height: Number
            }],
            default: []
        },
        hoaName: { type: String, index: true },
        hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', index: true }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('Feedback', feedbackSchema)
