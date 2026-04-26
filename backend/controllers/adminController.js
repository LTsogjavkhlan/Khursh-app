import User from '../models/User.js'
import Address from '../models/Address.js'
import Feedback from '../models/Feedback.js'
import Payment from '../models/Payment.js'
import Vehicle from '../models/Vehicle.js'
import GuestPass from '../models/GuestPass.js'
import { createUserNotification } from './notificationController.js'

export const getAllUsers = async (req, res) => {
    try {
        let users = []
        if (req.userHoaName) {
            users = await User.find({ hoaName: req.userHoaName }).select('-password').sort({ createdAt: -1 })
            // Fallback: if no users belong to this HOA yet (e.g. pre-HOA test data), return all users
            if (users.length === 0) {
                users = await User.find({}).select('-password').sort({ createdAt: -1 })
            }
        } else {
            users = await User.find({}).select('-password').sort({ createdAt: -1 })
        }
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUserDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })

        const feedbackCount = await Feedback.countDocuments({ user: req.params.id })
        const payments = await Payment.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(6)

        res.json({ user, feedbackCount, payments })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getPendingMemberships = async (req, res) => {
    try {
        const users = await User.find({ membershipStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const acceptMembership = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'active' },
            { new: true }
        ).select('-password')

        if (!user) return res.status(404).json({ message: 'User not found' })

        try {
            await createUserNotification({
                recipientId: user._id,
                title: 'Хүсэлт хүлээн авагдлаа ✅',
                message: `Та ${user.hoaName}-ийн оршин суугчаар батлагдлаа. Тавтай морил!`,
                type: 'general',
                createdBy: req.userId
            })
        } catch { /* ignore */ }

        res.json({ message: 'Хүсэлт хүлээн авагдлаа', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const rejectMembership = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'rejected' },
            { new: true }
        ).select('-password')

        if (!user) return res.status(404).json({ message: 'User not found' })

        try {
            await createUserNotification({
                recipientId: user._id,
                title: 'Хүсэлт татгалзагдлаа',
                message: `${user.hoaName}-д нэгдэх хүсэлт хянагдсаны дараа татгалзагдлаа. Дэлгэрэнгүйг профайл хэсгээс шалгана уу.`,
                type: 'general',
                createdBy: req.userId
            })
        } catch { /* ignore */ }

        res.json({ message: 'Хүсэлт татгалзагдлаа', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const cancelMembership = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { membershipStatus: 'none', hoaName: '' },
            { new: true }
        ).select('-password')

        if (!user) return res.status(404).json({ message: 'User not found' })

        // Also cancel all active/pending Address records for this user
        await Address.updateMany(
            { user: req.params.id, membershipStatus: { $in: ['active', 'pending'] } },
            { membershipStatus: 'none' }
        )

        try {
            await createUserNotification({
                recipientId: user._id,
                title: 'СӨХ-ийн гишүүнчлэл цуцлагдлаа',
                message: 'Таны СӨХ-ийн гишүүнчлэл администратороор цуцлагдлаа. Дэлгэрэнгүйг профайл хэсгээс шалгана уу.',
                type: 'general',
                createdBy: req.userId
            })
        } catch { /* ignore */ }

        res.json({ message: 'Гишүүнчлэл цуцлагдлаа', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role must be "user" or "admin"' })
        }

        if (req.params.id === req.userId) {
            return res.status(400).json({ message: 'Cannot change your own role' })
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.json({ message: 'Role updated', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ── Vehicles ──────────────────────────────────────────────

export const getAllVehiclesAdmin = async (req, res) => {
    try {
        let vehicleFilter = {}
        if (req.userHoaName) {
            const hoaUsers = await User.find({ hoaName: req.userHoaName }).select('_id')
            if (hoaUsers.length > 0) {
                vehicleFilter = { user: { $in: hoaUsers.map(u => u._id) } }
            }
            // If no HOA users found, vehicleFilter stays {} → return all (backward compat)
        }
        const vehicles = await Vehicle.find(vehicleFilter)
            .populate('user', 'firstName lastName building entrance floor apartmentNumber email')
            .sort({ createdAt: -1 })
        res.json(vehicles)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateVehicleAdmin = async (req, res) => {
    try {
        const { plate, model, color } = req.body
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { plate: plate?.toUpperCase(), model, color },
            { new: true }
        ).populate('user', 'firstName lastName building entrance floor apartmentNumber')
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
        res.json({ message: 'Vehicle updated', vehicle })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteVehicleAdmin = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id)
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
        res.json({ message: 'Vehicle deleted' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ── Guest Passes ──────────────────────────────────────────

export const getAllGuestPassesAdmin = async (req, res) => {
    try {
        let passFilter = {}
        if (req.userHoaName) {
            const hoaUsers = await User.find({ hoaName: req.userHoaName }).select('_id')
            if (hoaUsers.length > 0) {
                passFilter = { user: { $in: hoaUsers.map(u => u._id) } }
            }
            // If no HOA users found, passFilter stays {} → return all (backward compat)
        }
        const passes = await GuestPass.find(passFilter)
            .populate('user', 'firstName lastName building entrance floor apartmentNumber email')
            .sort({ expiresAt: -1 })
        res.json(passes)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteGuestPassAdmin = async (req, res) => {
    try {
        const pass = await GuestPass.findByIdAndDelete(req.params.id)
        if (!pass) return res.status(404).json({ message: 'Guest pass not found' })
        res.json({ message: 'Guest pass deleted' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
