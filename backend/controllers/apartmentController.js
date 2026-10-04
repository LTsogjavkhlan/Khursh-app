import Address from '../models/Address.js'
import ApartmentMember from '../models/ApartmentMember.js'
import TenantInvite from '../models/TenantInvite.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { syncUserApartmentContext } from '../utils/tenant.js'
import { createUserNotification } from './notificationController.js'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_PENDING_INVITES = 10 // per apartment
// Identical whether or not an account exists, so invites can't be used to
// discover who is registered.
const INVITE_SENT_MESSAGE = 'Урилга илгээгдлээ. Хэрэв энэ хаягаар бүртгэлтэй хэрэглэгч байвал урилгыг хүлээн авах боломжтой.'

const publicMember = (u) => ({
    _id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone
})

const fmtApartment = (a) => ({
    _id: a._id,
    hoaName: a.hoaName,
    building: a.building,
    entrance: a.entrance,
    floor: a.floor,
    apartmentNumber: a.apartmentNumber
})

const pendingInviteFilter = () => ({ status: 'pending', expiresAt: { $gt: new Date() } })

// Load the caller's owned apartment (Address) or respond 403/404.
// The apartment owner is definitively Address.user.
const loadOwnedApartment = async (req, res) => {
    const address = await Address.findById(req.params.addressId)
    if (!address) {
        res.status(404).json({ message: 'Орон сууц олдсонгүй' })
        return null
    }
    if (String(address.user) !== String(req.userId)) {
        res.status(403).json({ message: 'Зөвхөн эзэмшигч түрээслэгч удирдах боломжтой' })
        return null
    }
    return address
}

// Resolve the resident account an invite is for. Emails are unique; phones are
// not, so an ambiguous phone matches nobody rather than guessing.
const findInvitee = async (contact) => {
    if (contact.includes('@')) {
        return User.findOne({ email: contact.toLowerCase(), role: 'user' }).select('_id')
    }
    const matches = await User.find({ phone: contact, role: 'user' }).select('_id').limit(2)
    return matches.length === 1 ? matches[0] : null
}

// GET /api/apartments/mine — apartments the caller owns, with tenants and
// pending invites
export const getMyApartments = asyncHandler(async (req, res) => {
    const addresses = await Address.find({ user: req.userId }).sort({ isActive: -1, createdAt: 1 }).lean()
    const addressIds = addresses.map(a => a._id)

    const [tenantMembers, invites] = await Promise.all([
        ApartmentMember.find({ apartment: { $in: addressIds }, role: 'TENANT' })
            .populate('user', 'firstName lastName email phone').lean(),
        TenantInvite.find({ apartment: { $in: addressIds }, ...pendingInviteFilter() })
            .sort({ createdAt: -1 }).lean()
    ])

    const tenantsBy = new Map()
    for (const m of tenantMembers) {
        const key = String(m.apartment)
        if (!tenantsBy.has(key)) tenantsBy.set(key, [])
        if (m.user) tenantsBy.get(key).push({ memberId: m._id, user: publicMember(m.user) })
    }
    const invitesBy = new Map()
    for (const i of invites) {
        const key = String(i.apartment)
        if (!invitesBy.has(key)) invitesBy.set(key, [])
        // Only what the owner typed — never whether an account matched
        invitesBy.get(key).push({ _id: i._id, contact: i.contact, createdAt: i.createdAt, expiresAt: i.expiresAt })
    }

    const result = addresses.map(a => ({
        apartment: {
            ...fmtApartment(a),
            membershipStatus: a.membershipStatus,
            isActive: a.isActive
        },
        tenants: tenantsBy.get(String(a._id)) || [],
        invites: invitesBy.get(String(a._id)) || []
    }))

    res.json(result)
})

// POST /api/apartments/:addressId/invites { contact } — invite a tenant by
// email or phone. Always answers the same way whether or not an account exists.
export const createInvite = asyncHandler(async (req, res) => {
    const address = await loadOwnedApartment(req, res)
    if (!address) return

    if (address.membershipStatus !== 'active') {
        return res.status(400).json({ message: 'Зөвхөн баталгаажсан орон сууцанд түрээслэгч урих боломжтой' })
    }

    const contact = req.body.contact.includes('@') ? req.body.contact.toLowerCase() : req.body.contact

    // Re-inviting the same contact is a no-op (same response)
    const duplicate = await TenantInvite.exists({ apartment: address._id, contact, ...pendingInviteFilter() })
    if (duplicate) return res.status(201).json({ message: INVITE_SENT_MESSAGE })

    const pendingCount = await TenantInvite.countDocuments({ apartment: address._id, ...pendingInviteFilter() })
    if (pendingCount >= MAX_PENDING_INVITES) {
        return res.status(429).json({ message: 'Хүлээгдэж буй урилга хэт олон байна. Заримыг нь цуцлаад дахин оролдоно уу.' })
    }

    const invitee = await findInvitee(contact)
    // Self-invites and existing members are silently ignored: no invite is
    // delivered, and the response is the same as for any other contact.
    const deliverable = invitee
        && String(invitee._id) !== String(req.userId)
        && !(await ApartmentMember.exists({ apartment: address._id, user: invitee._id }))

    await TenantInvite.create({
        apartment: address._id,
        hoa: address.hoa,
        invitedBy: req.userId,
        contact,
        invitee: deliverable ? invitee._id : null,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS)
    })

    if (deliverable) {
        try {
            const owner = await User.findById(req.userId).select('firstName')
            await createUserNotification({
                recipientId: invitee._id,
                title: 'Түрээслэгчийн урилга ирлээ',
                message: `${owner?.firstName || 'Орон сууцны эзэмшигч'} таныг ${address.hoaName || 'СӨХ'}-ийн орон сууцны түрээслэгчээр урьлаа. Профайл хэсгээс хүлээн авна уу.`,
                type: 'general',
                createdBy: req.userId
            })
        } catch { /* notification failure should not block */ }
    }

    res.status(201).json({ message: INVITE_SENT_MESSAGE })
})

// DELETE /api/apartments/:addressId/invites/:inviteId — owner cancels an invite
export const cancelInvite = asyncHandler(async (req, res) => {
    const address = await loadOwnedApartment(req, res)
    if (!address) return

    const invite = await TenantInvite.findOneAndUpdate(
        { _id: req.params.inviteId, apartment: address._id, status: 'pending' },
        { status: 'cancelled', respondedAt: new Date() }
    )
    if (!invite) return res.status(404).json({ message: 'Урилга олдсонгүй' })
    res.json({ message: 'Урилга цуцлагдлаа' })
})

// GET /api/apartments/invites/mine — pending invites addressed to the caller
export const getMyInvites = asyncHandler(async (req, res) => {
    const invites = await TenantInvite.find({ invitee: req.userId, ...pendingInviteFilter() })
        .populate('apartment', 'hoaName building entrance floor apartmentNumber')
        .populate('invitedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean()

    res.json(invites.filter(i => i.apartment).map(i => ({
        _id: i._id,
        apartment: fmtApartment(i.apartment),
        invitedBy: i.invitedBy
            ? { firstName: i.invitedBy.firstName, lastName: i.invitedBy.lastName }
            : null,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt
    })))
})

// POST /api/apartments/invites/:inviteId/accept — become a tenant
export const acceptInvite = asyncHandler(async (req, res) => {
    // Claim the invite atomically so it can only be accepted once
    const invite = await TenantInvite.findOneAndUpdate(
        { _id: req.params.inviteId, invitee: req.userId, ...pendingInviteFilter() },
        { status: 'accepted', respondedAt: new Date() },
        { new: true }
    )
    if (!invite) return res.status(404).json({ message: 'Урилга олдсонгүй эсвэл хугацаа дууссан' })

    // The apartment must still be approved and still belong to the inviter
    const address = await Address.findById(invite.apartment)
    if (req.userRole !== 'user' || !address || address.membershipStatus !== 'active'
        || String(address.user) !== String(invite.invitedBy)) {
        await TenantInvite.updateOne({ _id: invite._id }, { status: 'cancelled' })
        return res.status(410).json({ message: 'Урилга хүчингүй болсон байна' })
    }

    await ApartmentMember.updateOne(
        { apartment: address._id, user: req.userId },
        { $setOnInsert: { hoa: address.hoa, role: 'TENANT', addedBy: invite.invitedBy } },
        { upsert: true }
    )

    // Grant HOA context so HOA-scoped content is visible to the tenant
    await syncUserApartmentContext(req.userId)

    try {
        const tenant = await User.findById(req.userId).select('firstName lastName')
        await createUserNotification({
            recipientId: invite.invitedBy,
            title: 'Урилга хүлээн авагдлаа',
            message: `${tenant?.firstName || ''} ${tenant?.lastName || ''}`.trim() + ' таны орон сууцны түрээслэгч боллоо.',
            type: 'general',
            createdBy: req.userId
        })
    } catch { /* ignore */ }

    res.json({ message: 'Та түрээслэгч боллоо' })
})

// POST /api/apartments/invites/:inviteId/decline
export const declineInvite = asyncHandler(async (req, res) => {
    const invite = await TenantInvite.findOneAndUpdate(
        { _id: req.params.inviteId, invitee: req.userId, status: 'pending' },
        { status: 'declined', respondedAt: new Date() }
    )
    if (!invite) return res.status(404).json({ message: 'Урилга олдсонгүй' })
    res.json({ message: 'Урилгаас татгалзлаа' })
})

// DELETE /api/apartments/:addressId/tenants/:userId — remove a tenant
export const removeTenant = asyncHandler(async (req, res) => {
    const address = await loadOwnedApartment(req, res)
    if (!address) return

    const membership = await ApartmentMember.findOne({
        apartment: address._id,
        user: req.params.userId,
        role: 'TENANT'
    })
    if (!membership) {
        return res.status(404).json({ message: 'Түрээслэгч олдсонгүй' })
    }

    await ApartmentMember.deleteOne({ _id: membership._id })

    // Recompute the tenant's HOA context (clears it if no memberships remain)
    await syncUserApartmentContext(req.params.userId)

    try {
        await createUserNotification({
            recipientId: req.params.userId,
            title: 'Орон сууцны хандалт цуцлагдлаа',
            message: `Таны ${address.hoaName || 'СӨХ'}-ийн орон сууцны түрээслэгчийн хандалт цуцлагдлаа.`,
            type: 'general',
            createdBy: req.userId
        })
    } catch { /* ignore */ }

    res.json({ message: 'Түрээслэгч хасагдлаа' })
})
