import mongoose from 'mongoose'

const vehicleSchema = new mongoose.Schema({
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
    model: {
        type: String,
        required: true
    },
    color: {
        type: String
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

export default mongoose.model('Vehicle', vehicleSchema)
