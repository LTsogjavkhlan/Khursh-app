import Vehicle from '../models/Vehicle.js'
import GuestPass from '../models/GuestPass.js'

export const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ user: req.userId }).sort({ isPrimary: -1, createdAt: 1 })
        res.json(vehicles)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const addVehicle = async (req, res) => {
    try {
        const { plate, model, color, isPrimary } = req.body

        if (isPrimary) {
            await Vehicle.updateMany({ user: req.userId }, { isPrimary: false })
        }

        const vehicle = new Vehicle({
            user: req.userId,
            plate,
            model,
            color,
            isPrimary: isPrimary || false
        })

        await vehicle.save()
        res.status(201).json({ message: 'Vehicle registered', vehicle })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, user: req.userId })
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' })
        }
        res.json({ message: 'Vehicle removed' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const setPrimaryVehicle = async (req, res) => {
    try {
        await Vehicle.updateMany({ user: req.userId }, { isPrimary: false })
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { isPrimary: true },
            { new: true }
        )
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' })
        }
        res.json({ message: 'Primary vehicle updated', vehicle })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// --- Guest Pass ---

export const getGuestPasses = async (req, res) => {
    try {
        const passes = await GuestPass.find({ user: req.userId }).sort({ expiresAt: -1 })
        res.json(passes)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const addGuestPass = async (req, res) => {
    try {
        const { plate, expiresAt } = req.body
        if (!plate || !expiresAt) {
            return res.status(400).json({ message: 'plate and expiresAt are required' })
        }
        const pass = new GuestPass({ user: req.userId, plate, expiresAt: new Date(expiresAt) })
        await pass.save()
        res.status(201).json({ message: 'Guest pass created', pass })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteGuestPass = async (req, res) => {
    try {
        const pass = await GuestPass.findOneAndDelete({ _id: req.params.id, user: req.userId })
        if (!pass) return res.status(404).json({ message: 'Guest pass not found' })
        res.json({ message: 'Guest pass removed' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
