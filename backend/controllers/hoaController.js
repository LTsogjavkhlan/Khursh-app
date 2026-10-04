import mongoose from 'mongoose'
import Hoa from '../models/Hoa.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { resolveUserByIdentifier, idEq } from '../utils/tenant.js'

// Public: list HOAs so residents can pick one when joining. This is the single
// source of truth for the join dropdown (replaces the hardcoded frontend list).
export const listHoas = asyncHandler(async (req, res) => {
    const hoas = await Hoa.find().select('name address').sort({ name: 1 })
    res.json(hoas)
})

// Platform admin: create a new HOA together with its first admin, in one step.
// A new HOA is a fully separate tenant — every resident, payment, feedback, etc.
// is scoped by its `hoa` id — and its admin is created already scoped to just
// this HOA, so they can never see or manage any other HOA's data.
export const createHoa = asyncHandler(async (req, res) => {
    const { name, address, adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone } = req.body

    const existingHoa = await Hoa.findOne({ name })
    if (existingHoa) {
        return res.status(400).json({ message: 'Энэ нэртэй СӨХ аль хэдийн бүртгэлтэй байна' })
    }
    const existingUser = await User.findOne({ email: adminEmail })
    if (existingUser) {
        return res.status(400).json({ message: 'Энэ имэйл хаягтай хэрэглэгч бүртгэлтэй байна' })
    }

    const hoa = await Hoa.create({ name, address: address || '' })

    let admin
    try {
        admin = await User.create({
            email: adminEmail,
            password: adminPassword,
            firstName: adminFirstName,
            lastName: adminLastName,
            phone: adminPhone,
            role: 'admin',
            hoa: hoa._id,
            hoaName: hoa.name,
        })
    } catch (err) {
        // Roll back the HOA so a failed admin creation never leaves an orphan org behind
        await Hoa.findByIdAndDelete(hoa._id)
        throw err
    }

    res.status(201).json({ message: 'СӨХ болон түүний админ үүсгэгдлээ', hoa, admin: publicAdmin(admin) })
})

// ── Platform admin: HOA admin management ────────────────────────────────────
// A newly created HOA has no admin until a platform admin either creates a
// fresh admin account for it, or promotes an already-registered user.

const publicAdmin = (u) => ({
    _id: u._id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
})

const loadHoa = async (req, res) => {
    const { hoaId } = req.params
    if (!mongoose.Types.ObjectId.isValid(hoaId)) {
        res.status(400).json({ message: 'Буруу СӨХ ID' })
        return null
    }
    const hoa = await Hoa.findById(hoaId)
    if (!hoa) {
        res.status(404).json({ message: 'СӨХ олдсонгүй' })
        return null
    }
    return hoa
}

// GET /api/hoas/:hoaId/admins — list the HOA's current admins
export const listHoaAdmins = asyncHandler(async (req, res) => {
    const hoa = await loadHoa(req, res)
    if (!hoa) return
    const admins = await User.find({ hoa: hoa._id, role: 'admin' })
        .select('-password')
        .sort({ createdAt: -1 })
    res.json(admins)
})

// POST /api/hoas/:hoaId/admins — create a brand-new admin account for this HOA
export const createHoaAdmin = asyncHandler(async (req, res) => {
    const hoa = await loadHoa(req, res)
    if (!hoa) return

    const { email, password, firstName, lastName, phone } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
        return res.status(400).json({ message: 'Энэ имэйл хаягтай хэрэглэгч бүртгэлтэй байна' })
    }

    const admin = await User.create({
        email, password, firstName, lastName, phone,
        role: 'admin', hoa: hoa._id, hoaName: hoa.name,
    })
    res.status(201).json({ message: 'Админ үүсгэгдлээ', admin: publicAdmin(admin) })
})

// PUT /api/hoas/:hoaId/admins/promote { identifier } — promote an existing
// registered user (by email/phone/id) to admin of this HOA
export const promoteToHoaAdmin = asyncHandler(async (req, res) => {
    const hoa = await loadHoa(req, res)
    if (!hoa) return

    const target = await resolveUserByIdentifier(req.body.identifier)
    if (!target) return res.status(404).json({ message: 'Бүртгэлтэй хэрэглэгч олдсонгүй' })
    if (target.role === 'platform_admin') {
        return res.status(400).json({ message: 'Платформ админы эрхийг өөрчлөх боломжгүй' })
    }

    target.role = 'admin'
    target.hoa = hoa._id
    target.hoaName = hoa.name
    await target.save()
    res.json({ message: 'Админ болголоо', admin: publicAdmin(target) })
})

// PUT /api/hoas/:hoaId/admins/:userId/demote — remove admin rights within this HOA
export const demoteHoaAdmin = asyncHandler(async (req, res) => {
    const hoa = await loadHoa(req, res)
    if (!hoa) return

    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Буруу хэрэглэгчийн ID' })
    }
    const target = await User.findById(userId)
    if (!target || target.role !== 'admin' || !idEq(target.hoa, hoa._id)) {
        return res.status(404).json({ message: 'Админ олдсонгүй' })
    }

    target.role = 'user'
    await target.save()
    res.json({ message: 'Админ эрх хасагдлаа', user: publicAdmin(target) })
})
