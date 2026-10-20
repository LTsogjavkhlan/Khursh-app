export const addressLine = (u) => [
  u?.building ? `${u.building}-р байр` : null,
  u?.entrance ? `${u.entrance}-р орц` : null,
  u?.floor ? `${u.floor}-р давхар` : null,
  u?.apartmentNumber ? `${u.apartmentNumber}-р тоот` : null,
].filter(Boolean).join(', ') || '—'

// ── Numbers & dates ─────────────────────────────────────────────────────────
// Chrome ships without Mongolian locale data, so Intl month names and compact
// notation silently fall back to English ("Oct", "500K"). Digit grouping is
// locale-neutral enough to use Intl; month and compact wording are built here.
const NUM = new Intl.NumberFormat('mn-MN')
const ONE_DECIMAL = new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 1 })

// Amounts keep the app's convention of the ₮ sign after the number
export const formatMoney = (v) => `${NUM.format(Math.round(v || 0))}₮`

// 500000 -> "500 мянга", 1350000 -> "1.4 сая"
export const formatCompact = (v) => {
  const n = v || 0
  if (Math.abs(n) >= 1e6) return `${ONE_DECIMAL.format(n / 1e6)} сая`
  if (Math.abs(n) >= 1e3) return `${ONE_DECIMAL.format(n / 1e3)} мянга`
  return NUM.format(n)
}

export const formatPercent = (ratio) => `${Math.round((ratio || 0) * 100)}%`

const parseMonth = (ym) => {
  const [y, m] = String(ym).split('-').map(Number)
  return { y, m: m || 1 }
}
export const formatMonthShort = (ym) => `${parseMonth(ym).m}-р сар`             // "10-р сар"
export const formatMonthLong = (ym) => { const { y, m } = parseMonth(ym); return `${y} оны ${m}-р сар` }
export const formatMonthOf = (ym) => `${parseMonth(ym).m}-р сарын`             // "10-р сарын …"
export const formatDay = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getMonth() + 1}-р сарын ${date.getDate()}`                    // "10-р сарын 20"
}
