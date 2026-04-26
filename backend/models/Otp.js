import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
    email:     { type: String, required: true, lowercase: true },
    code:      { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used:      { type: Boolean, default: false }
}, { timestamps: true })

// Auto-delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
