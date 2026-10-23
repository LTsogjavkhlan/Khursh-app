import express from 'express'
import {
    listPublishedReports,
    getPublishedReport,
    listAllReports,
    getReportForAdmin,
    createReport,
    updateReport,
    publishReport,
    unpublishReport,
    deleteReport,
    addAttachments,
    removeAttachment,
} from '../controllers/reportController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { uploadReportFiles } from '../middleware/upload.js'
import { validate, objectIdParam } from '../middleware/validate.js'
import { reportSchema } from '../validation/schemas.js'

const router = express.Router()
router.param('id', objectIdParam)
router.param('attachmentId', objectIdParam)

// Admin routes (drafts included). Registered before '/:id' so "admin" is
// never read as a report id.
router.get('/admin/all', protect, adminOnly, listAllReports)
router.get('/admin/:id', protect, adminOnly, getReportForAdmin)
router.post('/', protect, adminOnly, validate(reportSchema), createReport)
router.put('/:id', protect, adminOnly, validate(reportSchema), updateReport)
router.put('/:id/publish', protect, adminOnly, publishReport)
router.put('/:id/unpublish', protect, adminOnly, unpublishReport)
router.delete('/:id', protect, adminOnly, deleteReport)
router.post('/:id/attachments', protect, adminOnly, uploadReportFiles, addAttachments)
router.delete('/:id/attachments/:attachmentId', protect, adminOnly, removeAttachment)

// Residents: published reports of their own HOA only
router.get('/', protect, listPublishedReports)
router.get('/:id', protect, getPublishedReport)

export default router
