import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Load the caller's authorization context from the database rather than the
// token, so role changes and membership approval/rejection/cancellation take
// effect immediately. An HOA scope is granted only to:
//   - admins: the HOA a platform admin assigned them to (User.hoa)
//   - residents: their HOA once membership is `active` (pending/rejected => none)
// Returns null when the user no longer exists.
export const loadAuthContext = async (userId) => {
    if (!userId) return null
    const user = await User.findById(userId).select('role hoa hoaName membershipStatus').lean()
    if (!user) return null

    const hasHoa = Boolean(user.hoa) && (
        user.role === 'admin' ||
        (user.role === 'user' && user.membershipStatus === 'active')
    )
    return {
        role: user.role,
        hoaId: hasHoa ? user.hoa : null,
        hoaName: hasHoa ? (user.hoaName || null) : null,
    }
}

export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' })
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
        return res.status(401).json({ message: 'Token is not valid' })
    }
    // Password-reset tokens share the signing key but are not session tokens
    if (decoded.purpose) {
        return res.status(401).json({ message: 'Token is not valid' })
    }

    try {
        const ctx = await loadAuthContext(decoded.id)
        if (!ctx) {
            return res.status(401).json({ message: 'Token is not valid' })
        }
        req.userId      = decoded.id
        req.userRole    = ctx.role
        req.userHoaName = ctx.hoaName
        req.userHoaId   = ctx.hoaId
        next()
    } catch (error) {
        next(error)
    }
}

export const adminOnly = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Only admins can access this' })
    }
    next()
}

// Platform-level operator (runs the whole system, not scoped to one HOA) —
// distinct from `adminOnly`, which is an HOA admin scoped to their own HOA.
export const platformAdminOnly = (req, res, next) => {
    if (req.userRole !== 'platform_admin') {
        return res.status(403).json({ message: 'Only platform administrators can access this' })
    }
    next()
}
