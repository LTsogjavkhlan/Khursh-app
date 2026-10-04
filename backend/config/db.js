import mongoose from 'mongoose'
import dns from 'dns'
import { logger } from '../utils/logger.js'

export const connectDB = async () => {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1'])
        await mongoose.connect(process.env.MONGO_URI)
        logger.info('MongoDB connected')
    } catch (error) {
        logger.error('MongoDB connection error', { error: error.message })
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    try {
        await mongoose.disconnect()
        logger.info('MongoDB disconnected')
    } catch (error) {
        logger.error('MongoDB disconnection error', { error: error.message })
    }
}

// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
export const isDbReady = () => mongoose.connection.readyState === 1
