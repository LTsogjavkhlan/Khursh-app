import express from 'express'
import { getVehicles, addVehicle, deleteVehicle, setPrimaryVehicle, getGuestPasses, addGuestPass, deleteGuestPass } from '../controllers/vehicleController.js'
import { protect } from '../middleware/auth.js'
import { requireApartmentAccess } from '../utils/tenant.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { addVehicleSchema, addGuestPassSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Gate access / vehicles require an apartment membership (owner or tenant)
router.get('/', protect, requireApartmentAccess, getVehicles)
router.post('/', protect, requireApartmentAccess, validate(addVehicleSchema), addVehicle)
router.delete('/:id', protect, requireApartmentAccess, deleteVehicle)
router.put('/:id/primary', protect, requireApartmentAccess, setPrimaryVehicle)

// Guest passes
router.get('/guest-passes', protect, requireApartmentAccess, getGuestPasses)
router.post('/guest-passes', protect, requireApartmentAccess, validate(addGuestPassSchema), addGuestPass)
router.delete('/guest-passes/:id', protect, requireApartmentAccess, deleteGuestPass)

export default router
