import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    hoaName: { type: String, trim: true },
    building: { type: String, trim: true },
    entrance: { type: String, trim: true },
    floor:    { type: String, trim: true },
    apartmentNumber: { type: String, trim: true },
    membershipStatus: {
        type: String,
        enum: ['none', 'pending', 'active', 'rejected'],
        default: 'none',
    },
    isActive: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Address', addressSchema)
