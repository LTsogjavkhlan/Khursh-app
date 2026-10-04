import express from 'express'
import {
    getMyApartments,
    createInvite,
    cancelInvite,
    getMyInvites,
    acceptInvite,
    declineInvite,
    removeTenant
} from '../controllers/apartmentController.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { inviteTenantSchema, apartmentParamsSchema } from '../validation/schemas.js'

const router = express.Router()

// All routes require an authenticated user. Owner-only enforcement (that the
// caller owns the target apartment) happens inside the controller.
router.get('/mine', protect, getMyApartments)

// Invitee side: tenants join only by accepting an owner's invite
router.get('/invites/mine', protect, getMyInvites)
router.post('/invites/:inviteId/accept', protect, validate(apartmentParamsSchema, 'params'), acceptInvite)
router.post('/invites/:inviteId/decline', protect, validate(apartmentParamsSchema, 'params'), declineInvite)

// Owner side
router.post('/:addressId/invites', protect, validate(apartmentParamsSchema, 'params'), validate(inviteTenantSchema), createInvite)
router.delete('/:addressId/invites/:inviteId', protect, validate(apartmentParamsSchema, 'params'), cancelInvite)
router.delete('/:addressId/tenants/:userId', protect, validate(apartmentParamsSchema, 'params'), removeTenant)

export default router
