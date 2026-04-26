import CalendarEvent from '../models/CalendarEvent.js'

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
            hoaName: req.userHoaName || null
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
        const filter = req.userHoaName ? { hoaName: req.userHoaName } : {}
        const events = await CalendarEvent.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort({ date: 1 })
        res.json(events)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateEvent = async (req, res) => {
    try {
        let event = await CalendarEvent.findById(req.params.id)
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, {
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
        const event = await CalendarEvent.findByIdAndDelete(req.params.id)
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        res.json({
            message: 'Event deleted',
            event
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
