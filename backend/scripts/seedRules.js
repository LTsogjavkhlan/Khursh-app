/**
 * Seed the original default rule sections for a specific HOA, as a starting
 * template. Idempotent: only inserts sections whose title doesn't already
 * exist for that HOA, so it is safe to re-run.
 *
 * Pick the HOA by name (quotes needed if it contains spaces):
 *   node scripts/seedRules.js --hoa "Голден Хилл СӨХ"
 * If there is exactly one HOA in the DB, --hoa may be omitted.
 * Dry run (report only, no writes):
 *   node scripts/seedRules.js --hoa "Голден Хилл СӨХ" --dry
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import dns from 'dns'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DRY_RUN = process.argv.includes('--dry')

// Parse --hoa "name" (supports the value being the next argv token)
function getHoaArg() {
    const idx = process.argv.indexOf('--hoa')
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1].trim()
    return null
}

const DEFAULT_RULES = [
    {
        title: 'Ерөнхий дүрэм',
        items: [
            'Оршин суугчид бие биенийхээ амар тайван байдлыг хүндэтгэж, чимээ шуугиан гаргахгүй байх',
            'Нийтийн эзэмшлийн талбайд хог хаяхгүй байх',
            'Орон сууцны нийтийн талбайг эвдэж гэмтээхгүй байх',
            'Дуу чимээ гаргах хориотой цаг: 22:00-8:00'
        ]
    },
    {
        title: 'Автомашины дүрэм',
        items: [
            'Зориулалтын зогсоолд л автомашинаа байрлуулах',
            'Орон сууцны гарц хаах хэлбэрээр зогсоохыг хориглоно',
            'Зочны автомашин 24 цагаас илүү зогсоохыг хориглоно',
            'Нэг айлд хамгийн ихдээ 2 автомашины зөвшөөрөл олгоно'
        ]
    },
    {
        title: 'Хог хаягдлын дүрэм',
        items: [
            'Хог хаягдлыг зориулалтын хогийн савнуудад ангилан хаях',
            'Том хэмжээтэй эд зүйлс хаяхдаа СӨХ-тэй урьдчилан зөвшилцөх',
            'Барилгын хог хаягдлыг зөвшөөрөлгүйгээр хаяхыг хориглоно',
            'Хог хаях цаг: Өглөө 8:00-10:00, Оройн 18:00-20:00'
        ]
    },
    {
        title: 'Гал түймрийн аюулгүй байдал',
        items: [
            'Нийтийн талбайд гал түймэр гарч болзошгүй үйл ажиллагаа явуулахгүй байх',
            'Гал унтраагуур, гал дэмжих систем зэргийг гэмтээхгүй байх',
            'Гал түймрийн дохиоллын системийг эвдэхгүй байх',
            'Гал гарсан үед 101 дугаарт яаралтай мэдэгдэх'
        ]
    },
    {
        title: 'Дундын өмчийн хамгаалалт',
        items: [
            'Шат, зогсоол, коридор зэрэг дундын өмчийн талбайд эд зүйлс байрлуулахгүй байх',
            'Нийтийн эзэмшлийн талбайг өөрийн хэрэгцээнд дур мэдэн өөрчлөхгүй байх',
            'Нийтийн талбайн цэцэрлэг, ургамлыг эвдэхгүй, хамгаалах',
            'Нийтийн талбайн камер, гэрэлтүүлэг зэргийг эвдэхгүй байх'
        ]
    }
]

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
        console.error('❌  MONGO_URI is not set in backend/.env')
        process.exit(1)
    }

    dns.setServers(['8.8.8.8', '1.1.1.1'])
    await mongoose.connect(uri)
    console.log(`✅  Connected to MongoDB${DRY_RUN ? '  (DRY RUN — no writes)' : ''}`)

    const { default: Hoa } = await import('../models/Hoa.js')
    const { default: HoaRule } = await import('../models/HoaRule.js')

    // Resolve the target HOA
    let hoa = null
    const hoaArg = getHoaArg()
    if (hoaArg) {
        hoa = await Hoa.findOne({ name: hoaArg })
        if (!hoa) {
            const all = await Hoa.find({}).select('name')
            console.error(`❌  No HOA named "${hoaArg}". Available: ${all.map(h => `"${h.name}"`).join(', ') || '(none)'}`)
            await mongoose.disconnect()
            process.exit(1)
        }
    } else {
        const all = await Hoa.find({})
        if (all.length === 1) {
            hoa = all[0]
        } else {
            console.error(`❌  --hoa is required. Available HOAs: ${all.map(h => `"${h.name}"`).join(', ') || '(none)'}`)
            await mongoose.disconnect()
            process.exit(1)
        }
    }

    console.log(`\nℹ️   Target HOA: "${hoa.name}" (${hoa._id})`)

    // Skip sections that already exist (by title) for this HOA
    const existingTitles = new Set(
        (await HoaRule.find({ hoa: hoa._id }).select('title')).map(r => r.title)
    )

    const toCreate = DEFAULT_RULES
        .filter(r => !existingTitles.has(r.title))
        .map((r, i) => ({
            hoa: hoa._id,
            hoaName: hoa.name,
            title: r.title,
            items: r.items,
            order: i
        }))

    console.log(`\n🔧  ${DRY_RUN ? 'Would insert' : 'Inserting'} ${toCreate.length} section(s); skipping ${DEFAULT_RULES.length - toCreate.length} already present.`)
    toCreate.forEach(r => console.log(`   + ${r.title} (${r.items.length} rules)`))

    if (!DRY_RUN && toCreate.length > 0) {
        await HoaRule.insertMany(toCreate)
    }

    console.log(`\n✅  Seed ${DRY_RUN ? 'dry run' : 'run'} complete.`)
    await mongoose.disconnect()
}

main().catch(err => {
    console.error('❌  Error:', err.message)
    process.exit(1)
})
