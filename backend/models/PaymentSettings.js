import mongoose from 'mongoose'

const paymentSettingsSchema = new mongoose.Schema({
    monthlyFee: {
        type: Number,
        required: true,
        default: 50000
    },
    dueDay: {
        type: Number,
        default: 15
    },
    description: {
        type: String,
        default: 'СӨХ-ийн сарын хураамж'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hoaName: { type: String, index: true }
}, { timestamps: true })

export default mongoose.model('PaymentSettings', paymentSettingsSchema)
