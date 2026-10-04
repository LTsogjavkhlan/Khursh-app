import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
    email:     { type: String, required: true, lowercase: true, index: true },
    // SHA-256 of the code — the plain code is only ever sent by email
    codeHash:  { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Wrong guesses so far; the code is dead once this reaches the limit
    attempts:  { type: Number, default: 0 },
    // Set once the correct code is entered; the reset token is tied to this doc
    verified:  { type: Boolean, default: false },
    // Set when superseded by a newer code or consumed by a password reset
    used:      { type: Boolean, default: false }
}, { timestamps: true })

// Auto-delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
