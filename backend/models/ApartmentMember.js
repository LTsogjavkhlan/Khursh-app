import mongoose from 'mongoose'

// Links a user to an apartment (the owner's Address record) with a role.
// This is the single source of truth for who may access an apartment's HOA
// features. The apartment owner has an OWNER row; each granted tenant has a
// TENANT row. Access is resolved live from this collection so that granting or
// revoking a tenant takes effect immediately.
const apartmentMemberSchema = new mongoose.Schema(
    {
        // The apartment == the owner's Address record
        apartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true,
            index: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        // Denormalized HOA for scoping/queries
        hoa: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hoa',
            index: true
        },
        role: {
            type: String,
            enum: ['OWNER', 'TENANT'],
            required: true
        },
        // Who created this membership (for tenants: the owner)
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
)

// A user can only hold one role per apartment
apartmentMemberSchema.index({ apartment: 1, user: 1 }, { unique: true })

export default mongoose.model('ApartmentMember', apartmentMemberSchema)
