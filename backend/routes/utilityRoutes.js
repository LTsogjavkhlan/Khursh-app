import express from 'express'
import { getElectricityBill, getHeatBill } from '../controllers/utilityController.js'

const router = express.Router()

router.get('/electricity/:code', getElectricityBill)
router.get('/heat/:code',        getHeatBill)

export default router
