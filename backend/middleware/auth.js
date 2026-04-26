import jwt from 'jsonwebtoken'

export const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId      = decoded.id
        req.userRole    = decoded.role
        req.userHoaName = decoded.hoaName || null
        next()
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' })
    }
}

export const adminOnly = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Only admins can access this' })
    }
    next()
}
