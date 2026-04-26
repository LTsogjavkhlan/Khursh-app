/**
 * One-time script to create an admin user for a specific HOA.
 * Run from the backend folder:
 *   node scripts/createAdmin.js
 *
 * Edit the values below for each HOA you want to create.
 * To create a second HOA: change ADMIN_HOA_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD, then run again.
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

// ── Edit these before running ──────────────────────────────
const ADMIN_HOA_NAME  = 'Silver Hill СӨХ'   // ← REQUIRED: unique name per HOA
const ADMIN_EMAIL     = 'admin@SUKH.com'
const ADMIN_PASSWORD  = '88888888'
const ADMIN_FIRSTNAME = 'Админ'
const ADMIN_LASTNAME  = 'SilverHill'
const ADMIN_PHONE     = '95743064'
// ───────────────────────────────────────────────────────────

async function main() {
  if (!ADMIN_HOA_NAME.trim()) {
    console.error('❌  ADMIN_HOA_NAME is required — each HOA must have a unique name.')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) {
    console.error('❌  MONGO_URI is not set in backend/.env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('✅  Connected to MongoDB')

  // Dynamically import the model after connection is ready
  const { default: User } = await import('../models/User.js')

  const existing = await User.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    // Always reset role, password, and hoaName
    existing.role     = 'admin'
    existing.hoaName  = ADMIN_HOA_NAME
    existing.password = ADMIN_PASSWORD // pre('save') hook will hash this correctly
    await existing.save()
    console.log(`✅  Admin "${ADMIN_EMAIL}" updated — role set, password reset, HOA: ${ADMIN_HOA_NAME}`)
    console.log(`    Password: ${ADMIN_PASSWORD}`)
    await mongoose.disconnect()
    return
  }

  // Pass plain-text password — the User model's pre('save') hook hashes it automatically
  await User.create({
    email:     '6817007@muls.edu.mn',
    password:  6817007,
    firstName: 'Admin',
    lastName:  'HOA',
    phone:     96331122,
    role:      'admin',
    hoaName:   'Автай сайн СӨХ',
  })

  console.log(`✅  Admin user created:`)
  console.log(`    HOA     : ${ADMIN_HOA_NAME}`)
  console.log(`    Email   : ${ADMIN_EMAIL}`)
  console.log(`    Password: ${ADMIN_PASSWORD}`)
  console.log(`\n⚠️   Change the password after first login!`)
  console.log(`\n💡  To create another HOA admin, change ADMIN_HOA_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD above and run again.`)

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})
