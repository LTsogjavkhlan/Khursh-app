import { CheckCircle2, ArrowDownLeft, ArrowUpRight, Landmark, CalendarClock, FileText } from 'lucide-react'

// Transparency report section kinds (keys match backend/models/Report.js).
// `money` sections list amounts and show a total.
export const SECTION_META = {
    work:    { label: 'Хийгдсэн ажил',       icon: CheckCircle2,  tint: 'bg-brand-soft text-brand-text',         money: false },
    income:  { label: 'Орлого',              icon: ArrowDownLeft, tint: 'bg-success-bg text-success-text',       money: true },
    expense: { label: 'Зарлага',             icon: ArrowUpRight,  tint: 'bg-warning-bg text-warning-text',       money: true },
    finance: { label: 'Санхүүгийн мэдээлэл', icon: Landmark,      tint: 'bg-info-bg text-info-text',             money: true },
    plan:    { label: 'Төлөвлөгөө',          icon: CalendarClock, tint: 'bg-brand-soft text-brand-text',         money: false },
    other:   { label: 'Бусад',               icon: FileText,      tint: 'bg-surface-muted text-ink-secondary',   money: false },
}

export const sectionMeta = (kind) => SECTION_META[kind] || SECTION_META.other
export const sectionTitle = (s) => s.title?.trim() || sectionMeta(s.kind).label

// Period dates are stored as UTC midnight; read the calendar day straight from
// the ISO string so it never shifts with the viewer's timezone.
const parts = (iso) => {
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
    return { y, m, d }
}
const day = ({ m, d }) => `${m}-р сарын ${d}`

// "2026 оны 7-р сарын 1 – 9-р сарын 30"
export const periodLabel = (start, end) => {
    if (!start && !end) return ''
    if (start && !end) { const s = parts(start); return `${s.y} оны ${day(s)}-ээс хойш` }
    if (!start && end) { const e = parts(end); return `${e.y} оны ${day(e)} хүртэл` }
    const s = parts(start), e = parts(end)
    return s.y === e.y
        ? `${s.y} оны ${day(s)} – ${day(e)}`
        : `${s.y} оны ${day(s)} – ${e.y} оны ${day(e)}`
}

export const fileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
