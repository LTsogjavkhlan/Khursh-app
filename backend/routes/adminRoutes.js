import express from 'express'
import {
    getAllUsers,
    getUserDetail,
    updateUserRole,
    getPendingMemberships,
    acceptMembership,
    rejectMembership,
    cancelMembership,
    getAllVehiclesAdmin,
    updateVehicleAdmin,
    deleteVehicleAdmin,
    getAllGuestPassesAdmin,
    deleteGuestPassAdmin
} from '../controllers/adminController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, adminOnly, getUserDetail)
router.put('/users/:id/role', protect, adminOnly, updateUserRole)

// Membership requests
router.get('/memberships/pending', protect, adminOnly, getPendingMemberships)
router.put('/memberships/:id/accept', protect, adminOnly, acceptMembership)
router.put('/memberships/:id/reject', protect, adminOnly, rejectMembership)
router.put('/memberships/:id/cancel', protect, adminOnly, cancelMembership)

// Vehicles
router.get('/vehicles', protect, adminOnly, getAllVehiclesAdmin)
router.put('/vehicles/:id', protect, adminOnly, updateVehicleAdmin)
router.delete('/vehicles/:id', protect, adminOnly, deleteVehicleAdmin)

// Guest passes
router.get('/guest-passes', protect, adminOnly, getAllGuestPassesAdmin)
router.delete('/guest-passes/:id', protect, adminOnly, deleteGuestPassAdmin)

export default router
