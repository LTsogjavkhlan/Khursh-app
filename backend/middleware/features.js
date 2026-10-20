import Hoa from '../models/Hoa.js'
import { resolveFeatures } from '../config/features.js'

export const FEATURE_DISABLED_MESSAGE = 'Таны СӨХ-д энэ үйлчилгээ байхгүй байна'

// Route guard: refuse the request when the caller's HOA has `key` switched
// off. Use after `protect`. Responds with code FEATURE_DISABLED so the
// resident app can grey the control out and explain why.
export const requireFeature = (key) => async (req, res, next) => {
    try {
        const hoa = req.userHoaId ? await Hoa.findById(req.userHoaId).select('features').lean() : null
        if (!hoa || !resolveFeatures(hoa)[key]) {
            return res.status(403).json({ code: 'FEATURE_DISABLED', feature: key, message: FEATURE_DISABLED_MESSAGE })
        }
        next()
    } catch (err) {
        next(err)
    }
}
