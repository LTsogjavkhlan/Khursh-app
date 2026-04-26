import express from 'express'
import { protect, adminOnly } from '../middleware/auth.js'
import {
    getMyAddresses,
    createAddress,
    activateAddress,
    deleteAddress,
    adminGetPendingAddresses,
    adminAcceptAddress,
    adminRejectAddress,
    adminCancelAddress,
} from '../controllers/addressController.js'

const router = express.Router()

// User routes
router.get('/',               protect, getMyAddresses)
router.post('/',              protect, createAddress)
router.put('/:id/activate',   protect, activateAddress)
router.delete('/:id',         protect, deleteAddress)

// Admin routes
router.get('/admin/pending',          protect, adminOnly, adminGetPendingAddresses)
router.put('/admin/:id/accept',       protect, adminOnly, adminAcceptAddress)
router.put('/admin/:id/reject',       protect, adminOnly, adminRejectAddress)
router.put('/admin/:id/cancel',       protect, adminOnly, adminCancelAddress)

export default router
