import Address from '../models/Address.js'
import User from '../models/User.js'
import ApartmentMember from '../models/ApartmentMember.js'
import TenantInvite from '../models/TenantInvite.js'
import { createUserNotification } from './notificationController.js'
import { requireHoaId, findHoaIdByName, idEq, syncUserApartmentContext } from '../utils/tenant.js'

/* Sync the active address fields back to the User document so the rest of the
   app (admin panels, payments, feedback) still reads from User fields.
   Only ever touches residents — an admin's HOA must not move with an address. */
async function syncActiveToUser(userId, address) {
    await User.findOneAndUpdate({ _id: userId, role: 'user' }, {
        hoaName:         address?.hoaName ?? '',
        hoa:             address?.hoa ?? null,
        building:        address?.building ?? '',
        entrance:        address?.entrance ?? '',
        floor:           address?.floor ?? '',
        apartmentNumber: address?.apartmentNumber ?? '',
        membershipStatus: address?.membershipStatus ?? 'none',
    })
}

/* Keep an OWNER ApartmentMember row in sync with the owner's Address, so the
   apartment-access gate and shared-bill scoping resolve correctly. Idempotent. */
async function upsertOwnerMembership(address) {
    const userId = address?.user?._id || address?.user
    if (!address?._id || !userId) return
    await ApartmentMember.findOneAndUpdate(
        { apartment: address._id, user: userId },
        { $set: { role: 'OWNER', hoa: address.hoa ?? null }, $setOnInsert: { addedBy: userId } },
        { upsert: true }
    )
}

/* Remove every membership for an apartment (owner + tenants), cancel its
   pending invites, and recompute the affected tenants' HOA context so their
   access is revoked immediately. */
async function cascadeRemoveApartment(apartmentId) {
    if (!apartmentId) return
    await TenantInvite.updateMany({ apartment: apartmentId, status: 'pending' }, { status: 'cancelled' })
    const tenants = await ApartmentMember.find({ apartment: apartmentId, role: 'TENANT' }).select('user').lean()
    await ApartmentMember.deleteMany({ apartment: apartmentId })
    for (const t of tenants) {
        await syncUserApartmentContext(t.user)
    }
}

// GET /api/addresses — all addresses for the logged-in user
export const getMyAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.userId }).sort({ isActive: -1, createdAt: 1 })
        res.json(addresses)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// POST /api/addresses — request to join an HOA / add a new apartment
export const createAddress = async (req, res) => {
    try {
        const { hoaName, building, entrance, floor, apartmentNumber } = req.body
        if (!hoaName) return res.status(400).json({ message: 'СӨХ-ийн нэр шаардлагатай' })
        if (req.userRole !== 'user') {
            return res.status(403).json({ message: 'Зөвхөн оршин суугч орон сууц бүртгэх боломжтой' })
        }

        const hoa = await findHoaIdByName(hoaName)
        if (!hoa) return res.status(400).json({ message: 'СӨХ олдсонгүй' })

        const existing = await Address.countDocuments({ user: req.userId })

        const address = await Address.create({
            user: req.userId,
            hoaName,
            hoa,
            building, entrance, floor, apartmentNumber,
            membershipStatus: 'pending',
            isActive: existing === 0, // first address is auto-active
        })

        // Sync to User if it became the active one (status stays pending, so
        // this grants no HOA access until an admin approves it)
        if (address.isActive) await syncActiveToUser(req.userId, address)

        // The OWNER membership (apartment access) is only created once an admin
        // accepts the address — see adminAcceptAddress.

        res.status(201).json(address)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// PUT /api/addresses/:id/activate — set an address as the active one
export const activateAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.userId })
        if (!address) return res.status(404).json({ message: 'Хаяг олдсонгүй' })

        // Deactivate all others first
        await Address.updateMany({ user: req.userId }, { isActive: false })
        address.isActive = true
        await address.save()

        await syncActiveToUser(req.userId, address)

        res.json(address)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.userId })
        if (!address) return res.status(404).json({ message: 'Хаяг олдсонгүй' })

        // Revoke this apartment's memberships (owner + tenants)
        await cascadeRemoveApartment(address._id)

        // If deleted address was active, promote the next one
        if (address.isActive) {
            const next = await Address.findOne({ user: req.userId }).sort({ createdAt: 1 })
            if (next) {
                next.isActive = true
                await next.save()
                await syncActiveToUser(req.userId, next)
            } else {
                // No addresses left — clear User address fields
                await syncActiveToUser(req.userId, null)
            }
        }

        res.json({ message: 'Хаяг устгагдлаа' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

/* ── Admin-only: membership actions by Address._id ────────────── */

export const adminAcceptAddress = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const existing = await Address.findById(req.params.id).select('hoa')
        if (!existing || !idEq(existing.hoa, hoaId)) {
            return res.status(404).json({ message: 'Хаяг олдсонгүй' })
        }

        const address = await Address.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'active' },
            { new: true }
        ).populate('user', 'firstName lastName hoaName')

        if (!address) return res.status(404).json({ message: 'Хаяг олдсонгүй' })

        // If this is the user's active address, sync it
        if (address.isActive) await syncActiveToUser(address.user._id, address)

        // Ensure the owner's membership exists now that the apartment is active
        await upsertOwnerMembership(address)

        try {
            await createUserNotification({
                recipientId: address.user._id,
                title: 'Хүсэлт хүлээн авагдлаа ✅',
                message: `Та ${address.hoaName}-ийн оршин суугчаар батлагдлаа. Тавтай морил!`,
                type: 'general',
                createdBy: req.userId,
            })
        } catch { /* ignore */ }

        res.json({ message: 'Хүсэлт хүлээн авагдлаа', address })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const adminRejectAddress = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const existing = await Address.findById(req.params.id).select('hoa')
        if (!existing || !idEq(existing.hoa, hoaId)) {
            return res.status(404).json({ message: 'Хаяг олдсонгүй' })
        }

        const address = await Address.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'rejected' },
            { new: true }
        ).populate('user', 'firstName lastName hoaName')

        if (!address) return res.status(404).json({ message: 'Хаяг олдсонгүй' })

        if (address.isActive) await syncActiveToUser(address.user._id, address)

        // Rejected apartment => revoke memberships (owner + any tenants)
        await cascadeRemoveApartment(address._id)

        try {
            await createUserNotification({
                recipientId: address.user._id,
                title: 'Хүсэлт татгалзагдлаа',
                message: `${address.hoaName}-д нэгдэх хүсэлт татгалзагдлаа. Профайл хэсгээс шалгана уу.`,
                type: 'general',
                createdBy: req.userId,
            })
        } catch { /* ignore */ }

        res.json({ message: 'Хүсэлт татгалзагдлаа', address })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const adminCancelAddress = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const existing = await Address.findById(req.params.id).select('hoa')
        if (!existing || !idEq(existing.hoa, hoaId)) {
            return res.status(404).json({ message: 'Хаяг олдсонгүй' })
        }

        const address = await Address.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'none' },
            { new: true }
        ).populate('user', '_id firstName lastName')

        if (!address) return res.status(404).json({ message: 'Хаяг олдсонгүй' })

        if (address.isActive) await syncActiveToUser(address.user._id, address)

        // Cancelled membership => revoke memberships (owner + any tenants)
        await cascadeRemoveApartment(address._id)

        try {
            await createUserNotification({
                recipientId: address.user._id,
                title: 'СӨХ-ийн гишүүнчлэл цуцлагдлаа',
                message: 'Таны СӨХ-ийн гишүүнчлэл администратороор цуцлагдлаа.',
                type: 'general',
                createdBy: req.userId,
            })
        } catch { /* ignore */ }

        res.json({ message: 'Гишүүнчлэл цуцлагдлаа', address })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET /api/addresses/admin/pending — pending address membership requests
export const adminGetPendingAddresses = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const addresses = await Address.find({ membershipStatus: 'pending', hoa: hoaId })
            .populate('user', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
        res.json(addresses)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
