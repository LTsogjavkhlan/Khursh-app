/**
 * One-time script to create an admin user for a specific HOA.
 * Values come from the environment (backend/.env or the command line) so
 * credentials never end up in source control. Run from the backend folder:
 *   ADMIN_HOA_NAME='Silver Hill СӨХ' ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' node scripts/createAdmin.js
 *
 * Optional: ADMIN_FIRSTNAME, ADMIN_LASTNAME, ADMIN_PHONE.
 * For new HOAs, prefer the admin app's Organizations page (platform admin).
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const ADMIN_HOA_NAME  = (process.env.ADMIN_HOA_NAME || '').trim()
const ADMIN_EMAIL     = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || ''
const ADMIN_FIRSTNAME = process.env.ADMIN_FIRSTNAME || 'Админ'
const ADMIN_LASTNAME  = process.env.ADMIN_LASTNAME || 'СӨХ'
const ADMIN_PHONE     = process.env.ADMIN_PHONE || undefined

async function main() {
  if (!ADMIN_HOA_NAME || !ADMIN_EMAIL || ADMIN_PASSWORD.length < 8) {
    console.error('❌  Set ADMIN_HOA_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in backend/.env or on the command line.')
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

  // Dynamically import the models after connection is ready
  const { default: User } = await import('../models/User.js')
  const { default: Hoa } = await import('../models/Hoa.js')

  // Admins are scoped by the `hoa` reference, so the HOA must exist as a record
  const hoa = await Hoa.findOneAndUpdate(
    { name: ADMIN_HOA_NAME.trim() },
    { $setOnInsert: { name: ADMIN_HOA_NAME.trim() } },
    { new: true, upsert: true }
  )

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })
  if (existing) {
    // Always reset role, password, and HOA
    existing.role     = 'admin'
    existing.hoa      = hoa._id
    existing.hoaName  = hoa.name
    existing.password = ADMIN_PASSWORD // pre('save') hook will hash this correctly
    await existing.save()
    console.log(`✅  Admin "${ADMIN_EMAIL}" updated — role set, password reset, HOA: ${ADMIN_HOA_NAME}`)
    await mongoose.disconnect()
    return
  }

  // Pass plain-text password — the User model's pre('save') hook hashes it automatically
  await User.create({
    email:     ADMIN_EMAIL,
    password:  ADMIN_PASSWORD,
    firstName: ADMIN_FIRSTNAME,
    lastName:  ADMIN_LASTNAME,
    phone:     ADMIN_PHONE,
    role:      'admin',
    hoa:       hoa._id,
    hoaName:   hoa.name,
  })

  console.log(`✅  Admin user created:`)
  console.log(`    HOA     : ${ADMIN_HOA_NAME}`)
  console.log(`    Email   : ${ADMIN_EMAIL}`)
  console.log(`\n💡  To create another HOA admin, change ADMIN_HOA_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD above and run again.`)

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})
