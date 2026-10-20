// Page title block: 24px heading, optional one-line description and action.
export default function PageHeader({ title, description, action, className = '' }) {
    return (
        <header className={`mb-5 flex items-start justify-between gap-3 ${className}`}>
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">{title}</h1>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    )
}
