import mongoose from 'mongoose'

// A contact entry for a service relevant to an HOA (the HOA office itself,
// heating, electricity, plumber, elevator service, security, etc.). Admins
// manage these per HOA; residents read them on the Contact page.
const contactServiceSchema = new mongoose.Schema(
    {
        hoaName: { type: String },
        hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', index: true },
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ['hoa', 'heating', 'electricity', 'water', 'plumbing', 'elevator', 'security', 'internet', 'other'],
            default: 'other'
        },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, default: '' },
        // Optional free-text notes (address, working hours, etc.)
        description: { type: String, trim: true, default: '' },
        // Manual sort order (lower shows first)
        order: { type: Number, default: 0 },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
)

contactServiceSchema.index({ hoa: 1, order: 1 })

export default mongoose.model('ContactService', contactServiceSchema)
