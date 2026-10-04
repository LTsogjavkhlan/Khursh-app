/**
 * One-time script to create a platform administrator — an operator of the
 * whole system, not scoped to any single HOA (unlike createAdmin.js, which
 * creates an HOA-scoped admin).
 * Credentials come from the environment (backend/.env or the command line) so
 * they never end up in source control. Run from the backend folder:
 *   PLATFORM_ADMIN_EMAIL=you@example.com PLATFORM_ADMIN_PASSWORD='...' node scripts/createPlatformAdmin.js
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const PLATFORM_ADMIN_EMAIL     = (process.env.PLATFORM_ADMIN_EMAIL || '').trim().toLowerCase()
const PLATFORM_ADMIN_PASSWORD  = process.env.PLATFORM_ADMIN_PASSWORD || ''
const PLATFORM_ADMIN_FIRSTNAME = process.env.PLATFORM_ADMIN_FIRSTNAME || 'Platform'
const PLATFORM_ADMIN_LASTNAME  = process.env.PLATFORM_ADMIN_LASTNAME || 'Admin'

async function main() {
    if (!PLATFORM_ADMIN_EMAIL || PLATFORM_ADMIN_PASSWORD.length < 8) {
        console.error('❌  Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD (8+ characters) in backend/.env or on the command line.')
        process.exit(1)
    }

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        console.error('❌  MONGO_URI is not set in backend/.env')
        process.exit(1)
    }

    // Mirror the app's DNS workaround so the Atlas SRV record resolves
    dns.setServers(['8.8.8.8', '1.1.1.1'])

    await mongoose.connect(uri)
    console.log('✅  Connected to MongoDB')

    const { default: User } = await import('../models/User.js')

    const existing = await User.findOne({ email: PLATFORM_ADMIN_EMAIL })
    if (existing) {
        existing.role     = 'platform_admin'
        existing.password = PLATFORM_ADMIN_PASSWORD // pre('save') hook hashes this
        await existing.save()
        console.log(`✅  Platform admin "${PLATFORM_ADMIN_EMAIL}" updated — role set, password reset`)
        await mongoose.disconnect()
        return
    }

    await User.create({
        email:     PLATFORM_ADMIN_EMAIL,
        password:  PLATFORM_ADMIN_PASSWORD,
        firstName: PLATFORM_ADMIN_FIRSTNAME,
        lastName:  PLATFORM_ADMIN_LASTNAME,
        role:      'platform_admin',
    })

    console.log(`✅  Platform admin created:`)
    console.log(`    Email   : ${PLATFORM_ADMIN_EMAIL}`)

    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
