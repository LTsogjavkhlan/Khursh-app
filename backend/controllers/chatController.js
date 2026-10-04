import ChatMessage from '../models/ChatMessage.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { resolveHoaId } from '../utils/tenant.js'

const NO_HOA_MESSAGE = 'Танд СӨХ-д харьяалагдах эрх байхгүй тул чатыг ашиглах боломжгүй'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

// Shapes a stored message for the client, tolerating a sender whose account no
// longer exists (populate resolves to null rather than throwing).
const toDTO = (doc) => ({
    id: doc._id,
    content: doc.content,
    createdAt: doc.createdAt,
    sender: doc.sender
        ? { id: doc.sender._id, firstName: doc.sender.firstName, lastName: doc.sender.lastName }
        : { id: null, firstName: 'Устгагдсан', lastName: 'хэрэглэгч' },
})

// Resident/admin: paginated history for the caller's own HOA, oldest-of-page
// first cursoring backwards via `before` (a message's createdAt timestamp).
export const getMessages = asyncHandler(async (req, res) => {
    const hoaId = await resolveHoaId(req)
    if (!hoaId) {
        return res.status(403).json({ message: NO_HOA_MESSAGE })
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT)
    const filter = { hoa: hoaId }
    if (req.query.before) {
        const before = new Date(req.query.before)
        if (!isNaN(before.getTime())) {
            filter.createdAt = { $lt: before }
        }
    }

    const docs = await ChatMessage.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'firstName lastName')
        .lean()

    const nextCursor = docs.length === limit ? docs[docs.length - 1].createdAt : null

    res.json({
        messages: docs.reverse().map(toDTO),
        nextCursor,
    })
})

// Resident/admin: post a message into the caller's own HOA chat, then push it
// to everyone currently connected to that HOA's room over Socket.IO.
export const sendMessage = asyncHandler(async (req, res) => {
    const hoaId = await resolveHoaId(req)
    if (!hoaId) {
        return res.status(403).json({ message: NO_HOA_MESSAGE })
    }

    const message = await ChatMessage.create({
        hoa: hoaId,
        sender: req.userId,
        content: req.body.content,
    })
    await message.populate('sender', 'firstName lastName')

    const dto = toDTO(message)

    const io = req.app.get('io')
    io?.to(`hoa:${hoaId}`).emit('chat:message', dto)

    res.status(201).json(dto)
})
