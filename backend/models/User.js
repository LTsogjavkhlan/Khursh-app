import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    hoaName: {
        type: String
    },
    // Canonical tenant reference (parallel to hoaName during migration)
    hoa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hoa',
        index: true
    },
    building: {
        type: String
    },
    entrance: {
        type: String
    },
    floor: {
        type: String
    },
    apartmentNumber: {
        type: String
    },
    membershipStatus: {
        type: String,
        enum: ['none', 'pending', 'active', 'rejected'],
        default: 'none'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'platform_admin'],
        default: 'user'
    },
    utilityElectricity: { type: String, default: '' },
    utilityWaterHeat:   { type: String, default: '' },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// Indexes for HOA-scoped admin queries and membership filtering
userSchema.index({ hoaName: 1 })
userSchema.index({ membershipStatus: 1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcryptjs.hash(this.password, 10)
    next()
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
    return await bcryptjs.compare(password, this.password)
}

export default mongoose.model('User', userSchema)
