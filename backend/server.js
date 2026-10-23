// Load environment variables before any other module reads process.env
import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { connectDB, disconnectDB, isDbReady } from './config/db.js'
import { corsOptions, getAllowedOrigins } from './config/cors.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { requestLogger } from './middleware/requestLogger.js'
import { logger } from './utils/logger.js'
import { loadAuthContext } from './middleware/auth.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import vehicleRoutes from './routes/vehicleRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import utilityRoutes from './routes/utilityRoutes.js'
import hoaRoutes from './routes/hoaRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import ruleRoutes from './routes/ruleRoutes.js'
import apartmentRoutes from './routes/apartmentRoutes.js'
import chatRoutes from './routes/chatRoutes.js'

const app = express()

// Trust the first proxy hop (Render/Netlify/nginx) so req.ip and rate limiting
// key off the real client IP rather than the proxy's.
app.set('trust proxy', 1)

// Middleware
app.use(helmet())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(requestLogger)
app.use('/api', apiLimiter)

// Connect to MongoDB (non-blocking start; readiness probe reflects DB state)
connectDB()

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'HOA Backend API',
        health: '/api/health',
        ready: '/api/ready',
    })
})

// Liveness: process is up (used by orchestrators; does not check DB)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || 'development',
    })
})

// Readiness: process can serve traffic (DB connected)
app.get('/api/ready', (req, res) => {
    const dbReady = isDbReady()
    if (!dbReady) {
        return res.status(503).json({ status: 'not_ready', db: 'disconnected' })
    }
    res.json({ status: 'ready', db: 'connected' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/utility', utilityRoutes)
app.use('/api/hoas', hoaRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/rules', ruleRoutes)
app.use('/api/apartments', apartmentRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/reports', reportRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

// Error handler — never leak internal error details/stack to clients in prod
app.use((err, req, res, next) => {
    // A malformed id that slipped past route validation is a client error
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Буруу ID' })
    }
    logger.error('unhandled error', {
        error: err.message,
        path: req.originalUrl,
        method: req.method,
    })
    const isProd = process.env.NODE_ENV === 'production'
    res.status(err.status || 500).json({
        message: 'Internal server error',
        ...(isProd ? {} : { error: err.message })
    })
})

const PORT = process.env.PORT || 5000

// Socket.IO shares the same HTTP server as Express (one port, one process).
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: getAllowedOrigins(), credentials: true },
})

// Authenticate the socket handshake the same way `protect` authenticates a
// REST request: verify the JWT, then load the HOA scope from the database
// (active members and admins only) — never trust anything the client sends.
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
        return next(new Error('No token, authorization denied'))
    }
    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return next(new Error('Token is not valid'))
    }
    if (decoded.purpose) {
        return next(new Error('Token is not valid'))
    }
    try {
        const ctx = await loadAuthContext(decoded.id)
        if (!ctx) return next(new Error('Token is not valid'))
        if (!ctx.hoaId) return next(new Error('No HOA access'))
        socket.userId = decoded.id
        socket.userHoaId = ctx.hoaId
        next()
    } catch (err) {
        logger.error('socket auth error', { error: err.message })
        next(new Error('Internal server error'))
    }
})

// Join the caller's own HOA room, as resolved during the handshake.
io.on('connection', (socket) => {
    socket.join(`hoa:${socket.userHoaId}`)
})

// Controllers reach the socket server via req.app.get('io') to push new
// messages to everyone currently in the sender's HOA room.
app.set('io', io)

const server = httpServer.listen(PORT, () => {
    logger.info('Server started', {
        port: PORT,
        cors: getAllowedOrigins(),
        env: process.env.NODE_ENV || 'development',
    })
    if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
        logger.warn('CLIENT_URL is not set — CORS falls back to localhost and will block the production frontend')
    }
})

// Graceful shutdown so in-flight requests and the DB connection close cleanly
let shuttingDown = false
const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info('Shutting down', { signal })

    const forceTimer = setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
    }, 10_000)
    forceTimer.unref?.()

    server.close(async () => {
        io.close()
        await disconnectDB()
        logger.info('Shutdown complete')
        process.exit(0)
    })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default app
// Exposed so tests can shut the process down cleanly
export { server, io }
