import Report from '../models/Report.js'
import Notification from '../models/Notification.js'
import { requireHoaId, resolveHoaId, idEq } from '../utils/tenant.js'
import { isImageStoreConfigured, sniffFileType, uploadImage, deleteImages } from '../utils/imageStore.js'
import { logger } from '../utils/logger.js'

export const MAX_ATTACHMENTS = 20

const NOT_FOUND = { message: 'Тайлан олдсонгүй' }

// ── Shape sent to the apps ──────────────────────────────────────────────────
// Totals are computed here, once, so the homepage preview, the full report
// page and the admin preview always agree.

const sumAmounts = (items) => items.reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0)
const hasAmounts = (items) => items.some(i => typeof i.amount === 'number')

const present = (doc, { forResident = false } = {}) => {
    const r = doc.toObject({ versionKey: false })
    let income = 0, expense = 0, hasIncome = false, hasExpense = false
    r.sections = (r.sections || []).map(s => {
        const items = s.items || []
        const total = hasAmounts(items) ? sumAmounts(items) : null
        if (s.kind === 'income' && total !== null) { income += total; hasIncome = true }
        if (s.kind === 'expense' && total !== null) { expense += total; hasExpense = true }
        return { ...s, total }
    })
    r.totals = {
        income: hasIncome ? income : null,
        expense: hasExpense ? expense : null,
        // Only meaningful when both sides were reported
        net: hasIncome && hasExpense ? income - expense : null,
    }
    if (forResident) {
        // Residents never need storage ids or the editing trail
        r.attachments = (r.attachments || []).map(({ publicId, resourceType, ...a }) => a)
        delete r.createdBy; delete r.updatedBy; delete r.status; delete r.firstPublishedAt
    }
    return r
}

const toDate = (v) => (v ? new Date(`${v}T00:00:00.000Z`) : null)

const fromBody = (body) => ({
    title: body.title,
    summary: body.summary || '',
    periodStart: toDate(body.periodStart),
    periodEnd: toDate(body.periodEnd),
    sections: (body.sections || []).map(s => ({
        kind: s.kind,
        title: s.title || '',
        body: s.body || '',
        items: (s.items || []).map(i => ({
            label: i.label,
            amount: typeof i.amount === 'number' ? i.amount : null,
            note: i.note || '',
        })),
    })),
})

// Load a report that belongs to the admin's HOA, or respond 404
const loadOwn = async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return null
    const report = await Report.findById(req.params.id)
    if (!report || !idEq(report.hoa, hoaId)) {
        res.status(404).json(NOT_FOUND)
        return null
    }
    return report
}

// ── Residents (published only) ──────────────────────────────────────────────

export const listPublishedReports = async (req, res) => {
    try {
        const hoaId = await resolveHoaId(req)
        if (!hoaId) return res.json([])
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 50)
        const reports = await Report.find({ hoa: hoaId, status: 'published' })
            .sort({ publishedAt: -1 })
            .limit(limit)
        res.json(reports.map(r => present(r, { forResident: true })))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getPublishedReport = async (req, res) => {
    try {
        const hoaId = await resolveHoaId(req)
        const report = hoaId ? await Report.findById(req.params.id) : null
        // Drafts and other HOAs' reports look exactly like missing ones
        if (!report || report.status !== 'published' || !idEq(report.hoa, hoaId)) {
            return res.status(404).json(NOT_FOUND)
        }
        res.json(present(report, { forResident: true }))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ── Admins ──────────────────────────────────────────────────────────────────

export const listAllReports = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const reports = await Report.find({ hoa: hoaId }).sort({ updatedAt: -1 })
        res.json(reports.map(r => present(r)))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getReportForAdmin = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        res.json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createReport = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const report = await Report.create({
            ...fromBody(req.body),
            hoa: hoaId,
            hoaName: req.userHoaName || '',
            status: 'draft',
            createdBy: req.userId,
            updatedBy: req.userId,
        })
        res.status(201).json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateReport = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        // Status, HOA and attachments are never changed through this endpoint
        report.set(fromBody(req.body))
        report.updatedBy = req.userId
        await report.save()
        res.json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const hasContent = (r) =>
    Boolean(r.summary?.trim()) ||
    r.sections.some(s => s.body?.trim() || s.items.length) ||
    r.attachments.length > 0

export const publishReport = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        if (!hasContent(report)) {
            return res.status(400).json({ message: 'Нийтлэхийн өмнө товч тайлбар, хэсэг эсвэл хавсралт нэмнэ үү' })
        }
        const firstTime = !report.firstPublishedAt
        report.status = 'published'
        report.publishedAt = new Date()
        if (firstTime) report.firstPublishedAt = report.publishedAt
        report.updatedBy = req.userId
        await report.save()

        // Tell residents once per report; re-publishing after an edit stays quiet
        if (firstTime) {
            try {
                await Notification.create({
                    title: 'Шинэ тайлан нийтлэгдлээ',
                    message: report.title,
                    type: 'report',
                    recipient: null,
                    createdBy: req.userId,
                    hoaName: report.hoaName || null,
                    hoa: report.hoa,
                })
            } catch (err) {
                logger.error('report publish notification failed', { error: err.message })
            }
        }
        res.json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const unpublishReport = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        report.status = 'draft'
        report.publishedAt = null
        report.updatedBy = req.userId
        await report.save()
        res.json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const removeStored = async (attachments) => {
    const byType = { image: [], raw: [] }
    attachments.forEach(a => byType[a.resourceType === 'raw' ? 'raw' : 'image'].push(a.publicId))
    await deleteImages(byType.image, 'image')
    await deleteImages(byType.raw, 'raw')
}

export const deleteReport = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        await report.deleteOne()
        await removeStored(report.attachments)
        res.json({ message: 'Тайлан устгагдлаа' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Browsers send UTF-8 filenames but the multipart parser reads them as latin1;
// recover the original (e.g. Cyrillic) name when that round-trips cleanly.
const fileName = (raw) => {
    const name = String(raw || '')
    const utf8 = Buffer.from(name, 'latin1').toString('utf8')
    return (utf8.includes('�') ? name : utf8).slice(0, 150)
}

export const addAttachments = async (req, res) => {
    const files = req.files || []
    const uploaded = []
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        if (!files.length) return res.status(400).json({ message: 'Файл сонгоогүй байна' })
        if (report.attachments.length + files.length > MAX_ATTACHMENTS) {
            return res.status(400).json({ message: `Нэг тайланд хамгийн ихдээ ${MAX_ATTACHMENTS} хавсралт` })
        }
        if (!isImageStoreConfigured()) {
            return res.status(503).json({ message: 'Файл хадгалах үйлчилгээ тохируулагдаагүй байна.' })
        }
        // Check every file's real contents before uploading any of them
        const types = files.map(f => sniffFileType(f.buffer))
        if (types.some(t => !t)) {
            return res.status(400).json({ message: 'Зөвхөн зураг (JPEG, PNG, WebP, HEIC) эсвэл PDF хавсаргах боломжтой' })
        }
        const folder = `hoa/${report.hoa}/reports/${report._id}`
        for (let i = 0; i < files.length; i++) {
            const stored = await uploadImage(files[i].buffer, { folder, type: types[i] })
            uploaded.push({
                ...stored,
                kind: types[i] === 'pdf' ? 'pdf' : 'image',
                resourceType: stored.resourceType || (types[i] === 'pdf' ? 'raw' : 'image'),
                name: fileName(files[i].originalname),
                size: files[i].size,
            })
        }
        report.attachments.push(...uploaded)
        report.updatedBy = req.userId
        await report.save()
        res.status(201).json(present(report))
    } catch (error) {
        // Never leave files behind for attachments that weren't saved
        await removeStored(uploaded)
        logger.error('report attachment upload failed', { error: error.message, files: files.length })
        const isUpload = files.length && uploaded.length < files.length
        res.status(isUpload ? 502 : 500).json({
            message: isUpload ? 'Файл хадгалахад алдаа гарлаа. Дахин оролдоно уу.' : 'Хавсралт нэмэхэд алдаа гарлаа.'
        })
    }
}

export const removeAttachment = async (req, res) => {
    try {
        const report = await loadOwn(req, res)
        if (!report) return
        const att = report.attachments.id(req.params.attachmentId)
        if (!att) return res.status(404).json({ message: 'Хавсралт олдсонгүй' })
        const removed = att.toObject()
        att.deleteOne()
        report.updatedBy = req.userId
        await report.save()
        await removeStored([removed])
        res.json(present(report))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
