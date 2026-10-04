import ContactService from '../models/ContactService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireHoaId, resolveHoaId, idEq } from '../utils/tenant.js'

const VALID_CATEGORIES = ['hoa', 'heating', 'electricity', 'water', 'plumbing', 'elevator', 'security', 'internet', 'other']

// GET /api/contacts — list contact services for the caller's HOA (users + admins)
export const getContacts = asyncHandler(async (req, res) => {
    const hoaId = await resolveHoaId(req)
    if (!hoaId) return res.json([])
    const contacts = await ContactService.find({ hoa: hoaId })
        .sort({ order: 1, createdAt: 1 })
    res.json(contacts)
})

// POST /api/contacts — admin: add a service
export const createContact = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const { name, category, phone, email, description, order } = req.body
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Үйлчилгээний нэрийг оруулна уу' })
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Буруу ангилал' })
    }

    const contact = await ContactService.create({
        hoa: hoaId,
        hoaName: req.userHoaName || null,
        name: name.trim(),
        category: category || 'other',
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        description: description?.trim() || '',
        order: Number.isFinite(order) ? order : 0,
        createdBy: req.userId
    })

    res.status(201).json({ message: 'Үйлчилгээ нэмэгдлээ', contact })
})

// PUT /api/contacts/:id — admin: update a service
export const updateContact = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const existing = await ContactService.findById(req.params.id)
    if (!existing || !idEq(existing.hoa, hoaId)) {
        return res.status(404).json({ message: 'Үйлчилгээ олдсонгүй' })
    }

    const { name, category, phone, email, description, order } = req.body
    if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Буруу ангилал' })
    }
    if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ message: 'Үйлчилгээний нэрийг оруулна уу' })
        existing.name = name.trim()
    }
    if (category !== undefined) existing.category = category
    if (phone !== undefined) existing.phone = phone?.trim() || ''
    if (email !== undefined) existing.email = email?.trim() || ''
    if (description !== undefined) existing.description = description?.trim() || ''
    if (order !== undefined && Number.isFinite(order)) existing.order = order

    await existing.save()
    res.json({ message: 'Үйлчилгээ шинэчлэгдлээ', contact: existing })
})

// DELETE /api/contacts/:id — admin: delete a service
export const deleteContact = asyncHandler(async (req, res) => {
    const hoaId = await requireHoaId(req, res)
    if (!hoaId) return

    const existing = await ContactService.findById(req.params.id)
    if (!existing || !idEq(existing.hoa, hoaId)) {
        return res.status(404).json({ message: 'Үйлчилгээ олдсонгүй' })
    }
    await ContactService.findByIdAndDelete(req.params.id)
    res.json({ message: 'Үйлчилгээ устгагдлаа' })
})
