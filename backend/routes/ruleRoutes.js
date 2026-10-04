import express from 'express'
import {
    getRules,
    createRule,
    updateRule,
    deleteRule
} from '../controllers/ruleController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { createRuleSchema, updateRuleSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)

// Residents + admins: read the HOA's rules
router.get('/', protect, getRules)

// Admin: manage rules
router.post('/', protect, adminOnly, validate(createRuleSchema), createRule)
router.put('/:id', protect, adminOnly, validate(updateRuleSchema), updateRule)
router.delete('/:id', protect, adminOnly, deleteRule)

export default router
