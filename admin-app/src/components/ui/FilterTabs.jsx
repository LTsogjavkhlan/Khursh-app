import { useRef } from 'react'
import { FOCUS_RING } from './Button'

// Compact segmented filter: tabs = [{ id, label, count? }]. Arrow keys move
// between tabs (roving tabindex), as the ARIA tabs pattern expects.
export default function FilterTabs({ tabs, value, onChange, label, className = '' }) {
  const refs = useRef([])

  const onKeyDown = (e, i) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + tabs.length) % tabs.length
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto -mx-1 px-1 pb-0.5 ${className}`}>
      {tabs.map((t, i) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            ref={el => (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={e => onKeyDown(e, i)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-semibold transition-colors ${FOCUS_RING} ${
              active ? 'bg-brand text-on-brand' : 'text-ink-secondary hover:bg-surface-muted'
            }`}
          >
            {t.label}
            {t.count != null && <span className={`tabular-nums ${active ? 'text-white/75' : 'text-ink-muted'}`}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
