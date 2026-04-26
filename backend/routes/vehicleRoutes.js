import express from 'express'
import { getVehicles, addVehicle, deleteVehicle, setPrimaryVehicle, getGuestPasses, addGuestPass, deleteGuestPass } from '../controllers/vehicleController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getVehicles)
router.post('/', protect, addVehicle)
router.delete('/:id', protect, deleteVehicle)
router.put('/:id/primary', protect, setPrimaryVehicle)

// Guest passes
router.get('/guest-passes', protect, getGuestPasses)
router.post('/guest-passes', protect, addGuestPass)
router.delete('/guest-passes/:id', protect, deleteGuestPass)

export default router
