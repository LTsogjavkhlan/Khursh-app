import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/authRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import vehicleRoutes from './routes/vehicleRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import utilityRoutes from './routes/utilityRoutes.js'

const app = express()

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
connectDB()

// Root - friendly message so localhost:5000 doesn't show "Route not found"
app.get('/', (req, res) => {
    res.json({
        message: 'HOA Backend API',
        docs: 'Use /api/... endpoints. Try GET /api/health',
        health: '/api/health',
        auth: '/api/auth (register, login, me)',
        announcements: '/api/announcements',
        feedback: '/api/feedback',
        events: '/api/events',
        payments: '/api/payments',
    })
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'HOA Backend is running' })
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ message: 'Internal server error', error: err.message })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📝 API Documentation:`)
    console.log(`   POST   /api/auth/register`)
    console.log(`   POST   /api/auth/login`)
    console.log(`   GET    /api/announcements`)
    console.log(`   GET    /api/events`)
    console.log(`   POST   /api/feedback`)
    console.log(`   POST   /api/payments/request`)
    console.log(`   GET    /api/payments/history`)
})
