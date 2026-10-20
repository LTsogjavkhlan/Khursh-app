// Dashboard figures derived from the existing admin endpoints — no new API.
// Pure: takes the raw responses, returns everything the dashboard renders.

const PAID = 'completed'

// Collection per billing month ('YYYY-MM'), oldest first, last `limit` months
export function monthlyCollection(payments, limit = 6) {
  const byMonth = new Map()
  for (const p of payments) {
    if (!p.month) continue
    const m = byMonth.get(p.month) || { month: p.month, billed: 0, collected: 0, unpaidCount: 0 }
    m.billed += p.amount || 0
    if (p.status === PAID) m.collected += p.amount || 0
    else m.unpaidCount += 1
    byMonth.set(p.month, m)
  }
  return [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-limit)
    .map(m => ({ ...m, outstanding: m.billed - m.collected, rate: m.billed ? m.collected / m.billed : 0 }))
}

// Change vs the previous value: { ratio } for amounts, { points } for rates.
const change = (curr, prev) => (prev ? (curr - prev) / prev : null)

export function computeDashboard({ payments = [], feedback = [], pending = [], users = [] }) {
  const months = monthlyCollection(payments)
  const current = months[months.length - 1] || null
  const previous = months[months.length - 2] || null

  const unpaid = payments.filter(p => p.status !== PAID)
  const openFeedback = feedback.filter(f => f.status !== 'resolved')

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt))
    .slice(0, 6)

  return {
    months,
    current,
    collectedChange: current && previous ? change(current.collected, previous.collected) : null,
    rateChangePoints: current && previous ? (current.rate - previous.rate) * 100 : null,
    outstandingTotal: unpaid.reduce((sum, p) => sum + (p.amount || 0), 0),
    unpaidCount: unpaid.length,
    openFeedbackCount: openFeedback.length,
    inProgressCount: openFeedback.filter(f => f.status === 'in_progress').length,
    latestOpenFeedback: openFeedback.slice(0, 3),
    pending,
    residentCount: users.filter(u => u.role === 'user' && u.membershipStatus === 'active').length,
    recentPayments,
  }
}

// A "nice" axis maximum (1, 2, 2.5, 5 × 10^n) at or above `value`
export function niceMax(value) {
  if (!value || value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const base = 10 ** exp
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * base >= value) return step * base
  }
  return 10 * base
}
