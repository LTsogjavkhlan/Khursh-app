import mongoose from 'mongoose'

// One shared group chat per HOA — every resident and admin belonging to the
// same HOA reads/writes the same room. Scoped strictly by `hoa`, never by user.
const chatMessageSchema = new mongoose.Schema(
    {
        hoa: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hoa',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    { timestamps: true }
)

// Powers the paginated "messages for this HOA, newest first" query
chatMessageSchema.index({ hoa: 1, createdAt: -1 })

export default mongoose.model('ChatMessage', chatMessageSchema)
