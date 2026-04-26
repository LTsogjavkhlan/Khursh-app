import express from 'express'
import { register, login, getCurrentUser, updateProfile, requestMembership, changePassword, changeEmail, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getCurrentUser)
router.put('/profile', protect, updateProfile)
router.post('/request-membership', protect, requestMembership)
router.put('/change-password', protect, changePassword)
router.put('/change-email', protect, changeEmail)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

export default router
