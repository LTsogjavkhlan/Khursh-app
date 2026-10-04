import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hoaName: { type: String, index: true },
    hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', index: true },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: 'HOA Monthly Fee'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    // QPay Integration Fields
    qpayInvoiceId: {
        type: String
    },
    qpayTransactionId: {
        type: String
    },
    qpayDeeplink: {
        type: String
    },
    // Payment tracking
    month: {
        type: String // e.g., "2024-01"
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// Indexes for the hottest query paths (user history, monthly bill checks, admin lists)
paymentSchema.index({ user: 1, month: 1 })
paymentSchema.index({ user: 1, status: 1 })
paymentSchema.index({ status: 1 })

export default mongoose.model('Payment', paymentSchema)
