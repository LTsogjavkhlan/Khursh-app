import express from 'express'
import {
    getContacts,
    createContact,
    updateContact,
    deleteContact
} from '../controllers/contactController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { createContactSchema, updateContactSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Residents + admins: read the HOA's contact services
router.get('/', protect, getContacts)

// Admin: manage contact services
router.post('/', protect, adminOnly, validate(createContactSchema), createContact)
router.put('/:id', protect, adminOnly, validate(updateContactSchema), updateContact)
router.delete('/:id', protect, adminOnly, deleteContact)

export default router
