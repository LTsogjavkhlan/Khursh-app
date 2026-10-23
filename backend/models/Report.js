import mongoose from 'mongoose'

// "Ил тод байдал" transparency report: what the HOA did and where the money
// went over a period. Admins write drafts; only published reports are ever
// shown to residents.

export const SECTION_KINDS = ['work', 'income', 'expense', 'finance', 'plan', 'other']
export const REPORT_STATUSES = ['draft', 'published']

const itemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    // Money in ₮; null for non-financial lines (e.g. a completed-work item)
    amount: { type: Number, default: null },
    note: { type: String, default: '' },
})

const sectionSchema = new mongoose.Schema({
    kind: { type: String, enum: SECTION_KINDS, required: true },
    // Optional custom heading; the apps fall back to the kind's default label
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    items: { type: [itemSchema], default: [] },
})

const attachmentSchema = new mongoose.Schema({
    kind: { type: String, enum: ['image', 'pdf'], required: true },
    url: { type: String, required: true },
    thumbUrl: { type: String, default: null },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'raw'], default: 'image' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: Number,
    height: Number,
}, { timestamps: { createdAt: true, updatedAt: false } })

const reportSchema = new mongoose.Schema({
    hoa: { type: mongoose.Schema.Types.ObjectId, ref: 'Hoa', required: true },
    hoaName: { type: String, default: '' },
    title: { type: String, required: true },
    // Short plain-text overview, used for the homepage preview
    summary: { type: String, default: '' },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    sections: { type: [sectionSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: REPORT_STATUSES, default: 'draft' },
    // Set each time it is published; cleared on unpublish
    publishedAt: { type: Date, default: null },
    // First ever publication — residents are notified only once per report
    firstPublishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

reportSchema.index({ hoa: 1, status: 1, publishedAt: -1 })

export default mongoose.model('Report', reportSchema)
