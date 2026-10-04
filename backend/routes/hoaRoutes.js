import express from 'express'
import {
    listHoas,
    createHoa,
    listHoaAdmins,
    createHoaAdmin,
    promoteToHoaAdmin,
    demoteHoaAdmin,
} from '../controllers/hoaController.js'
import { protect, platformAdminOnly } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createHoaSchema, createHoaAdminSchema, promoteHoaAdminSchema } from '../validation/schemas.js'

const router = express.Router()

// Public: residents fetch the list of HOAs to join
router.get('/', listHoas)

// Platform admin: register a new HOA together with its first admin
router.post('/', protect, platformAdminOnly, validate(createHoaSchema), createHoa)

// Platform admin: manage a given HOA's admins
router.get('/:hoaId/admins', protect, platformAdminOnly, listHoaAdmins)
router.post('/:hoaId/admins', protect, platformAdminOnly, validate(createHoaAdminSchema), createHoaAdmin)
router.put('/:hoaId/admins/promote', protect, platformAdminOnly, validate(promoteHoaAdminSchema), promoteToHoaAdmin)
router.put('/:hoaId/admins/:userId/demote', protect, platformAdminOnly, demoteHoaAdmin)

export default router
