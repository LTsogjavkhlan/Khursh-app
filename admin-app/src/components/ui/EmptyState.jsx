export default function EmptyState({ icon, title, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center bg-surface rounded-card border border-line">
      {icon && (
        <div aria-hidden="true" className="mb-3 w-11 h-11 rounded-full bg-surface-muted text-ink-muted flex items-center justify-center">
          {icon}
        </div>
      )}
      <p className="text-sm text-ink-muted max-w-sm">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
