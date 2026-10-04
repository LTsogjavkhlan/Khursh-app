/* Simulated electricity bill API — consistent fake data seeded by consumer code */

const FIRST_NAMES = [
    'Батэрдэнэ', 'Номин', 'Мөнхбаяр', 'Оюунчимэг', 'Болд',
    'Сараа', 'Тэмүүжин', 'Энхтуяа', 'Ганбаатар', 'Нарантуяа',
    'Баярсайхан', 'Дэлгэрмаа', 'Отгонбаяр', 'Улзийхутаг', 'Мөнхцэцэг',
]
const LAST_NAMES = [
    'Баатар', 'Эрдэнэ', 'Мөнх', 'Золбоо', 'Болд',
    'Гантулга', 'Цэрэн', 'Доржсүрэн', 'Бадамсүрэн', 'Ням',
]
const DISTRICTS = [
    'Хан-Уул дүүрэг', 'Баянзүрх дүүрэг', 'Сүхбаатар дүүрэг',
    'Чингэлтэй дүүрэг', 'Баянгол дүүрэг', 'Налайх дүүрэг',
]
const KHOROOS = ['1-р', '2-р', '3-р', '4-р', '5-р', '6-р', '7-р', '8-р', '9-р', '10-р']

// Deterministic hash — same code always gives same numbers
function hash(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
        h >>>= 0                         // keep unsigned 32-bit
    }
    return h
}

// Seeded float [0, 1) using a secondary salt so each field is independent
function seeded(code, salt) {
    return hash(code + String(salt)) / 4294967295
}

// Pick a random item from an array using the seed
function pick(arr, code, salt) {
    return arr[Math.floor(seeded(code, salt) * arr.length)]
}

// Integer in [min, max] inclusive
function randInt(min, max, code, salt) {
    return Math.floor(seeded(code, salt) * (max - min + 1)) + min
}

const WATER_HEAT_PROVIDERS = ['Улаанбаатар Дулааны Сүлжээ ХК', 'Нийслэлийн Дулааны Систем', 'УБ Ус Халаалт ХХК']

export const getHeatBill = async (req, res) => {
    const { code } = req.params

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Хэрэглэгчийн код шаардлагатай' })
    }
    const clean = code.trim()
    if (clean.length < 4 || clean.length > 16) {
        return res.status(400).json({ error: 'Хэрэглэгчийн код 4–16 тэмдэгт байх ёстой' })
    }
    if (!/^[A-Za-z0-9]+$/.test(clean)) {
        return res.status(400).json({ error: 'Код зөвхөн үсэг, тоо агуулна' })
    }

    const delay = randInt(500, 1000, clean, 'hdelay')
    await new Promise(r => setTimeout(r, delay))

    const lastName  = pick(LAST_NAMES,  clean, 'hlast')
    const firstName = pick(FIRST_NAMES, clean, 'hfirst')
    const district  = pick(DISTRICTS,   clean, 'hdistrict')
    const khoroo    = pick(KHOROOS,     clean, 'hkhoroo')
    const building  = randInt(1, 40,    clean, 'hbuilding')
    const apartment = randInt(1, 200,   clean, 'hapt')

    // Heat: Гкал (gigacalories)
    const heatPricePerGcal = 27800
    const heatUsage_gcal   = +(seeded(clean, 'hgcal') * 9 + 3).toFixed(2)   // 3.00–12.00 Гкал
    const heatAmount       = Math.round(heatUsage_gcal * heatPricePerGcal)

    // Water: м³
    const waterPricePerM3  = 960
    const waterUsage_m3    = randInt(4, 18, clean, 'hwater')
    const waterAmount      = waterUsage_m3 * waterPricePerM3

    const totalAmount = heatAmount + waterAmount

    const prevHeat  = +(seeded(clean, 'hprev') * 200 + 50).toFixed(2)
    const currHeat  = +(prevHeat + heatUsage_gcal).toFixed(2)
    const prevWater = randInt(80, 600, clean, 'hwprev')
    const currWater = prevWater + waterUsage_m3

    const now = new Date()
    const due = new Date(now.getFullYear(), now.getMonth() + 1, 25)
    const dueDateStr = due.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })
    const billPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' })

    res.json({
        consumerCode: clean.toUpperCase(),
        customerName: `${lastName} ${firstName}`,
        address: `УБ хот, ${district}, ${khoroo} хороо, ${building}-р байр, ${apartment}-р тоот`,
        heatUsage_gcal,
        waterUsage_m3,
        previousHeatReading: prevHeat,
        currentHeatReading:  currHeat,
        previousWaterReading: prevWater,
        currentWaterReading:  currWater,
        heatPricePerGcal,
        waterPricePerM3,
        heatAmount,
        waterAmount,
        totalAmount,
        billPeriod,
        dueDate: dueDateStr,
        status: 'unpaid',
        provider: 'Улаанбаатар Дулааны Сүлжээ ХК',
    })
}

export const getElectricityBill = async (req, res) => {
    const { code } = req.params

    // Validation
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Хэрэглэгчийн код шаардлагатай' })
    }
    const clean = code.trim()
    if (clean.length < 4 || clean.length > 16) {
        return res.status(400).json({ error: 'Хэрэглэгчийн код 4–16 тэмдэгт байх ёстой' })
    }
    if (!/^[A-Za-z0-9]+$/.test(clean)) {
        return res.status(400).json({ error: 'Код зөвхөн үсэг, тоо агуулна' })
    }

    // Simulated network delay 500–1000ms
    const delay = randInt(500, 1000, clean, 'delay')
    await new Promise(r => setTimeout(r, delay))

    // Generate consistent fake data
    const lastName  = pick(LAST_NAMES,  clean, 'last')
    const firstName = pick(FIRST_NAMES, clean, 'first')
    const district  = pick(DISTRICTS,   clean, 'district')
    const khoroo    = pick(KHOROOS,     clean, 'khoroo')
    const building  = randInt(1, 40,    clean, 'building')
    const apartment = randInt(1, 200,   clean, 'apt')

    const pricePerUnit = 168   // ₮168 per kWh — current Ulaanbaatar rate

    const previousReading = randInt(4200, 12000, clean, 'prev')
    const usage_kWh       = randInt(100, 400,    clean, 'usage')
    const currentReading  = previousReading + usage_kWh
    const totalAmount     = usage_kWh * pricePerUnit

    // Due date — 20th of next month
    const now = new Date()
    const due = new Date(now.getFullYear(), now.getMonth() + 1, 20)
    const dueDateStr = due.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })

    // Billing period — last month
    const billPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' })

    res.json({
        consumerCode:    clean.toUpperCase(),
        customerName:    `${lastName} ${firstName}`,
        address:         `УБ хот, ${district}, ${khoroo} хороо, ${building}-р байр, ${apartment}-р тоот`,
        usage_kWh,
        previousReading,
        currentReading,
        pricePerUnit,
        totalAmount,
        billPeriod,
        dueDate:  dueDateStr,
        status:   'unpaid',
        provider: 'Улаанбаатар Эрчим Хүч ХК',
    })
}
