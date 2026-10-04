import CalendarEvent from '../models/CalendarEvent.js'
import { requireHoaId, resolveHoaId, idEq } from '../utils/tenant.js'

export const createEvent = async (req, res) => {
    try {
        const { title, description, date, time, location } = req.body

        const event = new CalendarEvent({
            title,
            description,
            date,
            time,
            location,
            createdBy: req.userId,
            hoaName: req.userHoaName || null,
            hoa: await resolveHoaId(req)
        })

        await event.save()
        res.status(201).json({
            message: 'Event created',
            event
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getEvents = async (req, res) => {
    try {
        // Only show events for the caller's HOA; no HOA => nothing to show
        const hoaId = await resolveHoaId(req)
        if (!hoaId) return res.json([])
        const events = await CalendarEvent.find({ hoa: hoaId })
            .populate('createdBy', 'firstName lastName email')
            .sort({ date: 1 })
        res.json(events)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateEvent = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        let event = await CalendarEvent.findById(req.params.id)
        if (!event || !idEq(event.hoa, hoaId)) {
            return res.status(404).json({ message: 'Event not found' })
        }

        // Never let the HOA tag be reassigned via an update
        const { hoaName, hoa, ...safeBody } = req.body
        event = await CalendarEvent.findByIdAndUpdate(req.params.id, safeBody, {
            new: true
        })

        res.json({
            message: 'Event updated',
            event
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteEvent = async (req, res) => {
    try {
        const hoaId = await requireHoaId(req, res)
        if (!hoaId) return
        const existing = await CalendarEvent.findById(req.params.id)
        if (!existing || !idEq(existing.hoa, hoaId)) {
            return res.status(404).json({ message: 'Event not found' })
        }
        const event = await CalendarEvent.findByIdAndDelete(req.params.id)

        res.json({
            message: 'Event deleted',
            event
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
