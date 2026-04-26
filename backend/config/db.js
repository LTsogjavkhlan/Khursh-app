import mongoose from 'mongoose'
import dns from 'dns'

export const connectDB = async () => {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1'])

        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ MongoDB connected')
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message)
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    try {
        await mongoose.disconnect()
        console.log('✅ MongoDB disconnected')
    } catch (error) {
        console.error('❌ MongoDB disconnection error:', error.message)
    }
}
