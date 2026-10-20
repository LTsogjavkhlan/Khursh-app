// Friendly placeholder for empty lists and failed loads. Pass `tone="error"`
// for load failures so the message reads as a problem, not "nothing here".
export default function EmptyState({ icon: IconComponent, title, description, action, tone = 'neutral', className = '' }) {
    const Icon = IconComponent
    const iconCls = tone === 'error' ? 'bg-danger-bg text-danger-text' : 'bg-surface-muted text-ink-muted'
    return (
        <div role={tone === 'error' ? 'alert' : undefined} className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
            {Icon && (
                <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${iconCls}`}>
                    <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
                </span>
            )}
            <p className="text-[15px] font-semibold text-ink">{title}</p>
            {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
