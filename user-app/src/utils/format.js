// Mongolian number/date formatting. Built by hand on purpose: Chrome ships
// without Mongolian Intl locale data, so Intl month names silently fall back to
// English. Digit grouping is locale-neutral, so Intl is fine for that part.
const NUM = new Intl.NumberFormat('mn-MN')

export const money = (v) => `${NUM.format(Math.round(Number(v) || 0))}₮`
export const number = (v) => NUM.format(Number(v) || 0)

const asDate = (d) => (d instanceof Date ? d : new Date(d))

// "10-р сарын 20"
export const dayLabel = (d) => { const x = asDate(d); return `${x.getMonth() + 1}-р сарын ${x.getDate()}` }
// "2026 оны 10-р сарын 20"
export const fullDate = (d) => { const x = asDate(d); return `${x.getFullYear()} оны ${dayLabel(x)}` }
// "YYYY-MM" -> "2026 оны 10-р сар"
export const monthLabel = (ym) => { const [y, m] = String(ym).split('-').map(Number); return `${y} оны ${m}-р сар` }
// "14:05"
export const timeLabel = (d) => { const x = asDate(d); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}` }

// "Дөнгөж сая", "5 минутын өмнө", "3 цагийн өмнө", "Өчигдөр", "4 өдрийн өмнө",
// then the calendar date for anything older than a week
export const relativeTime = (d) => {
    const x = asDate(d)
    const mins = Math.floor((Date.now() - x) / 60000)
    if (mins < 1) return 'Дөнгөж сая'
    if (mins < 60) return `${mins} минутын өмнө`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} цагийн өмнө`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Өчигдөр'
    if (days < 7) return `${days} өдрийн өмнө`
    return fullDate(x)
}
