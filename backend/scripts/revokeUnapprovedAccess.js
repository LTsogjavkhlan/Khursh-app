/**
 * Cleanup: revoke apartment access that was granted before approval.
 *
 * Previously, creating an Address immediately created an OWNER ApartmentMember
 * row, so a still-pending (or later rejected) address unlocked apartment
 * features. This removes every membership (owner + tenants) on an apartment
 * whose Address is not `active`, then recomputes the affected residents' HOA
 * context.
 *
 * It also reports admins that have no `hoa` reference — they have no HOA scope
 * now that access is resolved from `User.hoa` only. Fix those with
 * `node scripts/migrateToHoaEntity.js` or by re-running createAdmin.js.
 *
 * Safe to run multiple times.
 *
 * Dry run (report only, no writes):
 *   node scripts/revokeUnapprovedAccess.js --dry
 * Apply:
 *   node scripts/revokeUnapprovedAccess.js
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

    // Mirror the app's DNS workaround so the Atlas SRV record resolves
    dns.setServers(['8.8.8.8', '1.1.1.1'])

    await mongoose.connect(uri)
    console.log(`✅  Connected to MongoDB${DRY ? '  (DRY RUN — no writes)' : ''}`)

    const { default: Address } = await import('../models/Address.js')
    const { default: ApartmentMember } = await import('../models/ApartmentMember.js')
    const { default: User } = await import('../models/User.js')
    const { syncUserApartmentContext } = await import('../utils/tenant.js')

    const activeIds = new Set(
        (await Address.find({ membershipStatus: 'active' }).select('_id').lean()).map(a => String(a._id))
    )
    const members = await ApartmentMember.find().lean()
    const stale = members.filter(m => !activeIds.has(String(m.apartment)))

    console.log(`\nFound ${stale.length} membership(s) on non-approved apartments.`)
    for (const m of stale) {
        console.log(`   - ${m.role.padEnd(6)}  apartment=${m.apartment}  user=${m.user}`)
    }

    if (!DRY && stale.length) {
        await ApartmentMember.deleteMany({ _id: { $in: stale.map(m => m._id) } })
        const affectedUsers = [...new Set(stale.map(m => String(m.user)))]
        for (const userId of affectedUsers) {
            await syncUserApartmentContext(userId)
        }
        console.log(`✅  Removed ${stale.length} membership(s); recomputed ${affectedUsers.length} user(s).`)
    }

    const adminsWithoutHoa = await User.find({ role: 'admin', hoa: null }).select('email hoaName').lean()
    if (adminsWithoutHoa.length) {
        console.log(`\n⚠️   ${adminsWithoutHoa.length} admin(s) have no HOA reference and currently have no HOA scope:`)
        for (const a of adminsWithoutHoa) {
            console.log(`   - ${a.email}  (hoaName: ${a.hoaName || '—'})`)
        }
        console.log('   Run `node scripts/migrateToHoaEntity.js` to backfill them.')
    }

    if (DRY && stale.length) console.log('\n   Re-run without --dry to apply.')

    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
