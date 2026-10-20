import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

// Change vs a named period. `direction` is the arithmetic direction; `good`
// says whether that direction is good news, which picks the colour. The arrow
// and text carry the meaning, so it never depends on colour alone.
function Delta({ text, direction, good }) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const tone = direction === 'flat' ? 'bg-surface-muted text-ink-secondary'
    : good ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      <Icon className="w-3 h-3" aria-hidden="true" strokeWidth={2.5} />
      {text}
    </span>
  )
}

// Summary metric: label, prominent number, optional icon, change and hint.
// `accent` (legacy Tailwind colour classes) is accepted but unused — cards stay
// calm and let the numbers carry the emphasis.
export default function StatCard({ label, value, icon, hint, delta }) {
  return (
    <div className="bg-surface border border-line rounded-card shadow-card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon && (
          <span aria-hidden="true" className="w-9 h-9 rounded-control bg-surface-muted text-ink-secondary flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}
      </div>
      <p className="text-[28px] leading-none font-semibold tracking-tight text-ink truncate">{value}</p>
      {(delta || hint) && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
          {delta && <Delta {...delta} />}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  )
}
