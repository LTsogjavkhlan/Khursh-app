// Summary metric: label, prominent number, optional icon and one-line hint.
// `accent` (legacy Tailwind colour classes) is accepted but no longer used —
// cards stay calm and let the numbers carry the emphasis.
export default function StatCard({ label, value, icon, hint }) {
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
      <p className="text-[28px] leading-none font-semibold tracking-tight text-ink tabular-nums truncate">{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
