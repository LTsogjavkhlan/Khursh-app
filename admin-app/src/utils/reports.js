import { CheckCircle2, ArrowDownLeft, ArrowUpRight, Landmark, CalendarClock, FileText } from 'lucide-react'

// Transparency report section kinds (keys match backend/models/Report.js and
// the resident app's utils/reports.js). `money` sections list amounts.
export const SECTION_KINDS = ['work', 'income', 'expense', 'finance', 'plan', 'other']
export const SECTION_META = {
  work:    { label: 'Хийгдсэн ажил',       hint: 'Хийж дуусгасан ажил, үйл ажиллагаа', icon: CheckCircle2,  tint: 'bg-brand-soft text-brand-text',       money: false },
  income:  { label: 'Орлого',              hint: 'Цугласан хураамж, бусад орлого',       icon: ArrowDownLeft, tint: 'bg-success-bg text-success-text',     money: true },
  expense: { label: 'Зарлага',             hint: 'Мөнгийг юунд зарцуулсан',             icon: ArrowUpRight,  tint: 'bg-warning-bg text-warning-text',     money: true },
  finance: { label: 'Санхүүгийн мэдээлэл', hint: 'Дансны үлдэгдэл, сан гэх мэт',        icon: Landmark,      tint: 'bg-info-bg text-info-text',           money: true },
  plan:    { label: 'Төлөвлөгөө',          hint: 'Ирэх хугацаанд хийх ажил',            icon: CalendarClock, tint: 'bg-brand-soft text-brand-text',       money: false },
  other:   { label: 'Бусад',               hint: 'Бусад мэдээлэл',                      icon: FileText,      tint: 'bg-surface-muted text-ink-secondary', money: false },
}
export const sectionMeta = (kind) => SECTION_META[kind] || SECTION_META.other
export const sectionTitle = (s) => s.title?.trim() || sectionMeta(s.kind).label

// Same rules as the server's totals, for previewing unsaved edits
export function computeTotals(sections) {
  let income = 0, expense = 0, hasIncome = false, hasExpense = false
  const withTotals = sections.map(s => {
    const amounts = (s.items || []).map(i => i.amount).filter(a => typeof a === 'number')
    const total = amounts.length ? amounts.reduce((a, b) => a + b, 0) : null
    if (s.kind === 'income' && total !== null) { income += total; hasIncome = true }
    if (s.kind === 'expense' && total !== null) { expense += total; hasExpense = true }
    return { ...s, total }
  })
  return {
    sections: withTotals,
    totals: {
      income: hasIncome ? income : null,
      expense: hasExpense ? expense : null,
      net: hasIncome && hasExpense ? income - expense : null,
    },
  }
}

const parts = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return { y, m, d }
}
const day = ({ m, d }) => `${m}-р сарын ${d}`

// "2026 оны 7-р сарын 1 – 9-р сарын 30" (calendar day read from the ISO string)
export const periodLabel = (start, end) => {
  if (!start && !end) return ''
  if (start && !end) { const s = parts(start); return `${s.y} оны ${day(s)}-ээс хойш` }
  if (!start && end) { const e = parts(end); return `${e.y} оны ${day(e)} хүртэл` }
  const s = parts(start), e = parts(end)
  return s.y === e.y ? `${s.y} оны ${day(s)} – ${day(e)}` : `${s.y} оны ${day(s)} – ${e.y} оны ${day(e)}`
}

export const fullDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}` }

export const fileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
