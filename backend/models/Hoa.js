import mongoose from 'mongoose'

// A Home Owners Association (СӨХ) tenant. This is the canonical tenant entity:
// every tenant-scoped record references an Hoa by _id, so isolation is structural
// rather than based on a free-text name that can drift, collide, or be renamed.
const hoaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        address: { type: String, default: '' }
    },
    { timestamps: true }
)

export default mongoose.model('Hoa', hoaSchema)
