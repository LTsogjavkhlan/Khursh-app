import { FOCUS_RING } from './Button'

// Pill-style tab switcher. `tabs` = [{ id, label, count? }]. Arrow keys move
// between tabs, as users of tab widgets expect.
export default function SegmentedTabs({ tabs, value, onChange, label, className = '' }) {
    const onKeyDown = (e) => {
        const i = tabs.findIndex(t => t.id === value)
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault()
            const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]
            onChange(next.id)
            e.currentTarget.parentElement?.querySelector(`[data-tab="${next.id}"]`)?.focus()
        }
    }
    return (
        <div role="tablist" aria-label={label} className={`flex gap-1 rounded-full bg-surface-muted p-1 ${className}`}>
            {tabs.map(t => {
                const active = t.id === value
                return (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        data-tab={t.id}
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(t.id)}
                        onKeyDown={onKeyDown}
                        className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors duration-150 ${FOCUS_RING} ${
                            active ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`min-w-5 rounded-full px-1.5 text-xs tabular-nums ${active ? 'bg-brand-soft text-brand-text' : 'bg-surface text-ink-muted'}`}>{t.count}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
