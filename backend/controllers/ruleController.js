import HoaRule from '../models/HoaRule.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireHoaId, resolveHoaId, idEq } from '../utils/tenant.js'

// Normalize an incoming items payload into a clean array of non-empty strings
const cleanItems = (items) =>
    Array.isArray(items)
        ? items.map(i => (typeof i === 'string' ? i.trim() : '')).filter(Boolean)
        : []

// GET /api/rules — list rule sections for the caller's HOA (users + admins)
export const getRules = asyncHandler(async (req, res) => {
    const hoaId = await resolveHoaId(req)
    if (!hoaId) return res.json([])
    const rules = await HoaRule.find({ hoa: hoaId }).sort({ order: 1, createdAt: 1 })
    res.json(rules)
})

// POST /api/rules — admin: add a rule section
export const createRule = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const { title, items, order } = req.body
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Дүрмийн гарчгийг оруулна уу' })
    }

    const rule = await HoaRule.create({
        hoa: hoaId,
        hoaName: req.userHoaName || null,
        title: title.trim(),
        items: cleanItems(items),
        order: Number.isFinite(order) ? order : 0,
        createdBy: req.userId
    })

    res.status(201).json({ message: 'Дүрэм нэмэгдлээ', rule })
})

// PUT /api/rules/:id — admin: update a rule section
export const updateRule = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const existing = await HoaRule.findById(req.params.id)
    if (!existing || !idEq(existing.hoa, hoaId)) {
        return res.status(404).json({ message: 'Дүрэм олдсонгүй' })
    }

    const { title, items, order } = req.body
    if (title !== undefined) {
        if (!title.trim()) return res.status(400).json({ message: 'Дүрмийн гарчгийг оруулна уу' })
        existing.title = title.trim()
    }
    if (items !== undefined) existing.items = cleanItems(items)
    if (order !== undefined && Number.isFinite(order)) existing.order = order

    await existing.save()
    res.json({ message: 'Дүрэм шинэчлэгдлээ', rule: existing })
})

// DELETE /api/rules/:id — admin: delete a rule section
export const deleteRule = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const existing = await HoaRule.findById(req.params.id)
    if (!existing || !idEq(existing.hoa, hoaId)) {
        return res.status(404).json({ message: 'Дүрэм олдсонгүй' })
    }
    await HoaRule.findByIdAndDelete(req.params.id)
    res.json({ message: 'Дүрэм устгагдлаа' })
})
