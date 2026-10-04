import express from 'express'
import { getMessages, sendMessage } from '../controllers/chatController.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { sendChatMessageSchema } from '../validation/schemas.js'

const router = express.Router()

router.get('/messages', protect, getMessages)
router.post('/messages', protect, validate(sendChatMessageSchema), sendMessage)

export default router
