/**
 * Backfill OWNER ApartmentMember rows for existing apartments (Address records).
 *
 * Every Address whose membershipStatus is `active` represents an approved
 * owner's apartment, so its owner must have an OWNER membership for the new
 * apartment-access gate + shared-bill scoping to work. Idempotent thanks to the
 * unique { apartment, user } index.
 *
 * Dry run (default, no writes):
 *   node scripts/backfillApartmentMembers.js --dry
 * Apply:
 *   node scripts/backfillApartmentMembers.js
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DRY = process.argv.includes('--dry')

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        console.error('❌  MONGO_URI is not set in backend/.env')
        process.exit(1)
    }

    dns.setServers(['8.8.8.8', '1.1.1.1'])
    await mongoose.connect(uri)
    console.log(`✅  Connected to MongoDB${DRY ? '  (DRY RUN — no writes)' : '  (APPLY)'}`)

    const { default: Address } = await import('../models/Address.js')
    const { default: ApartmentMember } = await import('../models/ApartmentMember.js')

    const addresses = await Address.find({
        membershipStatus: 'active'
    }).lean()

    console.log(`\nFound ${addresses.length} owner apartment(s) to backfill.`)

    let created = 0
    let skipped = 0

    for (const a of addresses) {
        if (!a.user) { skipped++; continue }
        const existing = await ApartmentMember.findOne({ apartment: a._id, user: a.user }).lean()
        if (existing) {
            skipped++
            continue
        }
        console.log(`   + OWNER  apartment=${a._id}  user=${a.user}  hoa=${a.hoa || 'null'}  (${a.hoaName || '—'})`)
        if (!DRY) {
            await ApartmentMember.create({
                apartment: a._id,
                user: a.user,
                hoa: a.hoa || null,
                role: 'OWNER',
                addedBy: a.user
            })
        }
        created++
    }

    console.log(`\n${DRY ? 'ℹ️   Would create' : '✅  Created'} ${created} OWNER membership(s); skipped ${skipped} (already present / no user).`)
    if (DRY && created > 0) console.log('   Re-run without --dry to apply.')

    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
