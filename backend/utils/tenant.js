import mongoose from 'mongoose'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import ApartmentMember from '../models/ApartmentMember.js'

// Compare two values that may be ObjectIds, strings, or populated docs.
export const idEq = (a, b) => {
    if (!a || !b) return false
    const av = a._id || a
    const bv = b._id || b
    return String(av) === String(bv)
}

// Guard for admin endpoints: the admin MUST belong to an HOA, otherwise the
// request is rejected. This prevents the old "no HOA => see/act on everything"
// fallback that leaked data across HOAs.
export const ensureAdminHoa = (req, res) => {
    if (!req.userHoaName && !req.userHoaId) {
        res.status(403).json({ message: 'Энэ үйлдлийг гүйцэтгэхэд СӨХ-д бүртгэлтэй админ эрх шаардлагатай' })
        return false
    }
    return true
}

// Look up an existing Hoa by name. Returns null for blank or unknown names —
// HOAs are only ever created by a platform admin, never as a side effect of a
// user typing a name.
export const findHoaIdByName = async (name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return null
    const hoa = await Hoa.findOne({ name: trimmed }).select('_id')
    return hoa?._id || null
}

// The caller's HOA scope, as resolved from the database by `protect` (admins:
// their assigned HOA; residents: only once membership is active). Returns null
// when there is no HOA.
export const resolveHoaId = async (req) => req.userHoaId || null

// Resolve the admin's HOA id or respond 403. Returns the id, or null after
// sending the response (caller should `return` when null).
export const requireHoaId = async (req, res) => {
    const hoaId = await resolveHoaId(req)
    if (!hoaId) {
        res.status(403).json({ message: 'Энэ үйлдлийг гүйцэтгэхэд СӨХ-д бүртгэлтэй админ эрх шаардлагатай' })
        return null
    }
    return hoaId
}

// Find a registered user by email, phone, or user id. Shared by any admin flow
// that looks up an existing account before acting on it (adding a tenant,
// promoting an HOA admin, etc).
export const resolveUserByIdentifier = async (identifier) => {
    const id = (identifier || '').trim()
    if (!id) return null
    if (id.includes('@')) return User.findOne({ email: id.toLowerCase() })
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        const byId = await User.findById(id)
        if (byId) return byId
    }
    return User.findOne({ phone: id })
}

// True when the given user belongs to the given HOA (by Hoa _id).
export const userInHoa = async (userId, hoaId) => {
    if (!userId || !hoaId) return false
    const owner = await User.findById(userId).select('hoa')
    return idEq(owner?.hoa, hoaId)
}

// True when a document belongs to the given HOA. Matches by the doc's own `hoa`
// ref, or (as a fallback) the owning user's `hoa`. `ownerField` is the doc field
// holding the owning user id.
export const docInHoa = async (doc, hoaId, ownerField = 'user') => {
    if (!doc || !hoaId) return false
    if (idEq(doc.hoa, hoaId)) return true
    const ownerId = doc[ownerField]?._id || doc[ownerField]
    return userInHoa(ownerId, hoaId)
}

// ── Apartment membership (owner/tenant access) ──────────────────────────────

// Return a user's apartment memberships (lean docs with apartment, role, hoa).
// This is resolved live so granting/revoking a tenant takes effect immediately.
export const getApartmentAccess = async (userId) => {
    if (!userId) return []
    return ApartmentMember.find({ user: userId }).lean()
}

// Middleware: block apartment features unless the caller belongs to >=1 apartment
// (as OWNER or TENANT). Enforces "no apartment access => no apartment features".
export const requireApartmentAccess = async (req, res, next) => {
    try {
        const count = await ApartmentMember.countDocuments({ user: req.userId })
        if (count === 0) {
            return res.status(403).json({ message: 'Танд орон сууцны хандалт байхгүй байна. Эзэмшигчээр холбогдоно уу.' })
        }
        next()
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Recompute a user's cached HOA context (User.hoa/hoaName/membershipStatus) from
// their apartment memberships. Used when a tenant is added/removed so their
// HOA-scoped content stays correct. Prefers an OWNER membership as the primary
// context; clears the context entirely when the user has no memberships left.
// Only ever touches residents: an admin's HOA is assigned by a platform admin
// and must never be moved by apartment membership changes.
export const syncUserApartmentContext = async (userId) => {
    if (!userId) return
    const memberships = await ApartmentMember.find({ user: userId }).lean()
    if (!memberships.length) {
        await User.findOneAndUpdate({ _id: userId, role: 'user' }, { hoa: null, hoaName: '', membershipStatus: 'none' })
        return
    }
    const primary = memberships.find(m => m.role === 'OWNER') || memberships[0]
    const hoaDoc = primary.hoa ? await Hoa.findById(primary.hoa).select('name') : null
    await User.findOneAndUpdate({ _id: userId, role: 'user' }, {
        hoa: primary.hoa || null,
        hoaName: hoaDoc?.name || '',
        membershipStatus: 'active'
    })
}
