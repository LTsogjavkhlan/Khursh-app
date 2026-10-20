import { Children, cloneElement, isValidElement, useId } from 'react'

export const fieldInputCls =
  'w-full rounded-control border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted transition-colors duration-150 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed aria-[invalid=true]:border-danger-text'

// Label + control + error. When given a single form control, the label is
// linked to it (htmlFor/id) and the error is announced and attached via
// aria-describedby, so every form built on FormField is accessible.
export default function FormField({ label, error, className = '', children }) {
  const autoId = useId()
  const single = Children.count(children) === 1 && isValidElement(children) ? children : null
  const id = single?.props.id || autoId
  const errorId = `${id}-error`

  const control = single
    ? cloneElement(single, {
        id,
        'aria-invalid': error ? true : single.props['aria-invalid'],
        'aria-describedby': [single.props['aria-describedby'], error ? errorId : null].filter(Boolean).join(' ') || undefined,
      })
    : children

  return (
    <div className={className}>
      {label && (
        <label htmlFor={single ? id : undefined} className="text-[13px] font-medium text-ink-secondary block mb-1.5">
          {label}
        </label>
      )}
      {control}
      {error && <p id={errorId} role="alert" className="text-xs text-danger-text mt-1.5">{error}</p>}
    </div>
  )
}
