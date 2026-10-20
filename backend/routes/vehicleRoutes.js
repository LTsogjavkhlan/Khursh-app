import express from 'express'
import { getVehicles, addVehicle, deleteVehicle, setPrimaryVehicle, getGuestPasses, addGuestPass, deleteGuestPass } from '../controllers/vehicleController.js'
import { protect } from '../middleware/auth.js'
import { requireApartmentAccess } from '../utils/tenant.js'
import { requireFeature } from '../middleware/features.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { addVehicleSchema, addGuestPassSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Gate access / vehicles require an apartment membership (owner or tenant).
// Adding is also gated by the HOA's features; viewing and removing what is
// already registered stays available when a feature is switched off.
router.get('/', protect, requireApartmentAccess, getVehicles)
router.post('/', protect, requireApartmentAccess, requireFeature('vehicleRegistration'), validate(addVehicleSchema), addVehicle)
router.delete('/:id', protect, requireApartmentAccess, deleteVehicle)
router.put('/:id/primary', protect, requireApartmentAccess, requireFeature('vehicleRegistration'), setPrimaryVehicle)

// Guest passes
router.get('/guest-passes', protect, requireApartmentAccess, getGuestPasses)
router.post('/guest-passes', protect, requireApartmentAccess, requireFeature('guestPass'), validate(addGuestPassSchema), addGuestPass)
router.delete('/guest-passes/:id', protect, requireApartmentAccess, deleteGuestPass)

export default router
