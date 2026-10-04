import { logger } from '../utils/logger.js'

// Logs each HTTP request after it finishes: method, path, status, duration, IP.
// Skips the noisy health/ready probes so log volume stays useful.
const SKIP = new Set(['/api/health', '/api/ready'])

export const requestLogger = (req, res, next) => {
    if (SKIP.has(req.path)) return next()

    const start = Date.now()
    res.on('finish', () => {
        logger.info('request', {
            method: req.method,
            path: req.originalUrl?.split('?')[0] || req.path,
            status: res.statusCode,
            ms: Date.now() - start,
            ip: req.ip,
        })
    })
    next()
}
