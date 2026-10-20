import { FOCUS_RING } from './Button'

// Round icon-only row action (edit, delete…). `label` is required: it is the
// accessible name and the hover tooltip.
export default function IconAction({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-full text-ink-muted transition-colors disabled:opacity-50 ${FOCUS_RING} ${
        danger ? 'hover:bg-danger-bg hover:text-danger-text' : 'hover:bg-surface-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
