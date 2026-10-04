import mongoose from 'mongoose'

// A rule section for an HOA: a titled group of bullet-point rules (e.g.
// "Автомашины дүрэм" with several items). Admins manage these per HOA;
// residents read them on the Rules page.
const hoaRuleSchema = new mongoose.Schema(
    {
        hoaName: { type: String },
        hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', index: true },
        title: {
            type: String,
            required: true,
            trim: true
        },
        // Individual bullet-point rules within this section
        items: {
            type: [String],
            default: []
        },
        // Manual sort order (lower shows first)
        order: { type: Number, default: 0 },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
)

hoaRuleSchema.index({ hoa: 1, order: 1 })

export default mongoose.model('HoaRule', hoaRuleSchema)
