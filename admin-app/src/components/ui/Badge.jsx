// Status badge. Always rendered with text; the optional dot is decorative.
const TONES = {
  green: 'bg-success-bg text-success-text',
  yellow: 'bg-warning-bg text-warning-text',
  orange: 'bg-warning-bg text-warning-text',
  red: 'bg-danger-bg text-danger-text',
  blue: 'bg-info-bg text-info-text',
  slate: 'bg-surface-muted text-ink-secondary',
}

export default function Badge({ tone = 'slate', dot = false, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${TONES[tone] || TONES.slate} ${className}`}>
      {dot && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current" />}
      {children}
    </span>
  )
}
