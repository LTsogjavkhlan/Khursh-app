/**
 * Migration: introduce the Hoa entity and backfill the `hoa` ObjectId reference
 * on every tenant-scoped record from the existing free-text `hoaName`.
 *
 * Safe to run multiple times (idempotent): it find-or-creates Hoa docs by name
 * and only sets `hoa` where it is currently missing.
 *
 * Dry run (report only, no writes):
 *   node scripts/migrateToHoaEntity.js --dry
 * Apply:
 *   node scripts/migrateToHoaEntity.js
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DRY_RUN = process.argv.includes('--dry')

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        console.error('❌  MONGO_URI is not set in backend/.env')
        process.exit(1)
    }

    // Mirror the app's DNS workaround so the Atlas SRV record resolves
    dns.setServers(['8.8.8.8', '1.1.1.1'])

    await mongoose.connect(uri)
    console.log(`✅  Connected to MongoDB${DRY_RUN ? '  (DRY RUN — no writes)' : ''}`)

    const { default: Hoa } = await import('../models/Hoa.js')
    const { default: User } = await import('../models/User.js')
    const { default: Payment } = await import('../models/Payment.js')
    const { default: Feedback } = await import('../models/Feedback.js')
    const { default: Announcement } = await import('../models/Announcement.js')
    const { default: CalendarEvent } = await import('../models/CalendarEvent.js')
    const { default: Notification } = await import('../models/Notification.js')
    const { default: Address } = await import('../models/Address.js')
    const { default: PaymentSettings } = await import('../models/PaymentSettings.js')

    const collections = [
        ['User', User],
        ['Payment', Payment],
        ['Feedback', Feedback],
        ['Announcement', Announcement],
        ['CalendarEvent', CalendarEvent],
        ['Notification', Notification],
        ['Address', Address],
        ['PaymentSettings', PaymentSettings],
    ]

    // 1) Gather every distinct, non-blank hoaName across all collections
    const names = new Set()
    for (const [, Model] of collections) {
        const distinct = await Model.distinct('hoaName', { hoaName: { $nin: [null, ''] } })
        distinct.forEach(n => { if (n && n.trim()) names.add(n.trim()) })
    }
    console.log(`\nℹ️   Found ${names.size} distinct HOA name(s): ${[...names].join(' | ') || '(none)'}`)

    // 2) Find-or-create an Hoa per name and build a name -> _id map
    const nameToId = new Map()
    for (const name of names) {
        let hoa = await Hoa.findOne({ name })
        if (!hoa) {
            if (DRY_RUN) {
                console.log(`   would CREATE Hoa "${name}"`)
                // Use a placeholder id so downstream dry-run counts are accurate
                nameToId.set(name, new mongoose.Types.ObjectId())
                continue
            }
            hoa = await Hoa.create({ name })
            console.log(`   created Hoa "${name}"`)
        }
        nameToId.set(name, hoa?._id || null)
    }

    // 3) Backfill `hoa` where missing, per collection per name
    console.log('\n🔧  Backfilling `hoa` references...')
    for (const [label, Model] of collections) {
        let updated = 0
        for (const name of names) {
            const id = nameToId.get(name)
            if (!id && !DRY_RUN) continue
            const filter = { hoaName: name, $or: [{ hoa: { $exists: false } }, { hoa: null }] }
            if (DRY_RUN) {
                updated += await Model.countDocuments(filter)
            } else {
                const r = await Model.updateMany(filter, { $set: { hoa: id } })
                updated += r.modifiedCount || 0
            }
        }
        console.log(`   ${label}: ${DRY_RUN ? 'would update' : 'updated'} ${updated} doc(s)`)
    }

    // 3b) Backfill `hoa` for owner-bound records that have no hoaName, using the
    //     owning user's HOA. Catches e.g. payments from requestPayment (which never
    //     stamped hoaName) and personal notifications.
    console.log('\n🔧  Backfilling `hoa` from owning user (records with no hoaName)...')
    const allUsers = await User.find({}).select('_id hoa hoaName')
    const userHoa = new Map()
    for (const u of allUsers) {
        const id = u.hoa || nameToId.get((u.hoaName || '').trim())
        if (id) userHoa.set(u._id.toString(), id)
    }

    const ownerBound = [
        ['Payment', Payment, 'user'],
        ['Feedback', Feedback, 'user'],
        ['Address', Address, 'user'],
        ['Notification', Notification, 'recipient'],
    ]
    for (const [label, Model, ownerField] of ownerBound) {
        const candidates = await Model.find({
            $or: [{ hoa: { $exists: false } }, { hoa: null }],
            [ownerField]: { $ne: null }
        }).select(`_id ${ownerField}`)

        let updated = 0
        for (const doc of candidates) {
            const ownerId = doc[ownerField]?.toString()
            const id = ownerId && userHoa.get(ownerId)
            if (!id) continue
            if (DRY_RUN) { updated++; continue }
            await Model.updateOne({ _id: doc._id }, { $set: { hoa: id } })
            updated++
        }
        console.log(`   ${label}: ${DRY_RUN ? 'would update' : 'updated'} ${updated} doc(s)`)
    }

    // 4) Report records still missing a `hoa` link for manual review
    console.log('\n⚠️   Records still WITHOUT a `hoa` link (review manually):')
    for (const [label, Model] of collections) {
        const orphan = await Model.countDocuments({
            $or: [{ hoa: { $exists: false } }, { hoa: null }]
        })
        if (orphan > 0) console.log(`   ${label}: ${orphan}`)
    }

    console.log(`\n✅  Migration ${DRY_RUN ? 'dry run' : 'run'} complete.`)
    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
