/**
 * List (and optionally delete) tenant records that still have NO `hoa` link
 * after the HOA-entity migration. These are typically leftover test records.
 *
 * IMPORTANT: User documents with no HOA are NOT treated as orphans here —
 * a freshly-registered user who hasn't joined an HOA is legitimate. Only the
 * content/owner-bound collections are scanned.
 *
 * List only (safe, default):
 *   node scripts/cleanupOrphans.js
 * Delete the listed orphans:
 *   node scripts/cleanupOrphans.js --delete
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DO_DELETE = process.argv.includes('--delete')

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        console.error('❌  MONGO_URI is not set in backend/.env')
        process.exit(1)
    }

    dns.setServers(['8.8.8.8', '1.1.1.1'])
    await mongoose.connect(uri)
    console.log(`✅  Connected to MongoDB${DO_DELETE ? '  (DELETE MODE)' : '  (list only)'}`)

    const { default: Payment } = await import('../models/Payment.js')
    const { default: Feedback } = await import('../models/Feedback.js')
    const { default: Announcement } = await import('../models/Announcement.js')
    const { default: CalendarEvent } = await import('../models/CalendarEvent.js')
    const { default: Notification } = await import('../models/Notification.js')
    const { default: Address } = await import('../models/Address.js')
    const { default: PaymentSettings } = await import('../models/PaymentSettings.js')

    // Scanned collections (User intentionally excluded — see header note)
    const collections = [
        ['Payment', Payment],
        ['Feedback', Feedback],
        ['Announcement', Announcement],
        ['CalendarEvent', CalendarEvent],
        ['Notification', Notification],
        ['Address', Address],
        ['PaymentSettings', PaymentSettings],
    ]

    const orphanFilter = { $or: [{ hoa: { $exists: false } }, { hoa: null }] }
    let grandTotal = 0

    for (const [label, Model] of collections) {
        const docs = await Model.find(orphanFilter).lean()
        if (docs.length === 0) continue
        grandTotal += docs.length
        console.log(`\n── ${label}: ${docs.length} orphan(s) ──`)
        for (const d of docs) {
            const preview = {
                _id: d._id,
                user: d.user,
                recipient: d.recipient,
                hoaName: d.hoaName,
                title: d.title,
                month: d.month,
                createdAt: d.createdAt,
            }
            Object.keys(preview).forEach(k => preview[k] === undefined && delete preview[k])
            console.log('   ', JSON.stringify(preview))
        }

        if (DO_DELETE) {
            const r = await Model.deleteMany(orphanFilter)
            console.log(`   🗑️  deleted ${r.deletedCount} ${label} doc(s)`)
        }
    }

    console.log(`\n${DO_DELETE ? '✅  Deleted' : 'ℹ️   Found'} ${grandTotal} orphan record(s) total.`)
    if (!DO_DELETE && grandTotal > 0) {
        console.log('   Re-run with --delete to remove them.')
    }

    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
