import { Children, cloneElement, isValidElement, useId } from 'react'

// Shared input styling: 44px touch height, 3:1 border, visible focus.
export const inputCls =
    'w-full min-h-11 rounded-control border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted transition-colors duration-150 focus:outline-none focus:border-brand-text focus:ring-2 focus:ring-brand-text/25 disabled:bg-surface-muted disabled:text-ink-muted aria-[invalid=true]:border-danger-text'

// Label + control + optional hint/error. With a single control child the
// label is linked to it (htmlFor/id) and hint/error are attached via
// aria-describedby.
export default function Field({ label, hint, error, className = '', children }) {
    const autoId = useId()
    const single = Children.count(children) === 1 && isValidElement(children) ? children : null
    const id = single?.props.id || autoId
    const hintId = `${id}-hint`
    const errorId = `${id}-error`

    const control = single
        ? cloneElement(single, {
            id,
            'aria-invalid': error ? true : single.props['aria-invalid'],
            'aria-describedby': [single.props['aria-describedby'], hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined,
        })
        : children

    return (
        <div className={className}>
            {label && <label htmlFor={single ? id : undefined} className="mb-1.5 block text-[13px] font-medium text-ink-secondary">{label}</label>}
            {control}
            {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
            {error && <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger-text">{error}</p>}
        </div>
    )
}
