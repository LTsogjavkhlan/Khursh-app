import mongoose from 'mongoose'

const guestPassSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plate: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true })

export default mongoose.model('GuestPass', guestPassSchema)
