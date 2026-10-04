import mongoose from 'mongoose'

// An owner's invitation for someone to become a tenant of their apartment.
// Nobody is attached to an apartment without accepting an invite, and the
// owner never learns whether an account exists for the contact they typed:
// `invitee` is resolved server-side and is never shown to the owner.
const tenantInviteSchema = new mongoose.Schema(
    {
        // The apartment == the owner's Address record
        apartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true,
            index: true
        },
        hoa: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hoa'
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Exactly what the owner typed (email or phone) — the only thing the
        // owner ever sees about a pending invite
        contact: {
            type: String,
            required: true
        },
        // Matching resident account, or null when there is none
        invitee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'cancelled'],
            default: 'pending'
        },
        expiresAt: {
            type: Date,
            required: true
        },
        respondedAt: Date
    },
    { timestamps: true }
)

tenantInviteSchema.index({ invitee: 1, status: 1 })

export default mongoose.model('TenantInvite', tenantInviteSchema)
