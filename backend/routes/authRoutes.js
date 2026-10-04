import express from 'express'
import { register, login, getCurrentUser, updateProfile, requestMembership, changePassword, changeEmail, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    requestMembershipSchema,
    changePasswordSchema,
    changeEmailSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
} from '../validation/schemas.js'

const router = express.Router()

// Sensitive, unauthenticated endpoints get a strict per-IP limiter
router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', protect, getCurrentUser)
router.put('/profile', protect, validate(updateProfileSchema), updateProfile)
router.post('/request-membership', protect, validate(requestMembershipSchema), requestMembership)
router.put('/change-password', protect, validate(changePasswordSchema), changePassword)
router.put('/change-email', protect, validate(changeEmailSchema), changeEmail)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword)

export default router
