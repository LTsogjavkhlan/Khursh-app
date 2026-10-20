import { Loader2 } from 'lucide-react'

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'

const VARIANTS = {
    primary: 'bg-brand text-on-brand hover:bg-brand-hover',
    secondary: 'bg-surface text-ink border border-line hover:bg-surface-muted',
    soft: 'bg-brand-soft text-brand-text hover:bg-surface-muted',
    ghost: 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
    danger: 'bg-danger-bg text-danger-text hover:brightness-95',
}

const SIZES = {
    sm: 'h-9 px-3.5 text-[13px] gap-1.5',
    md: 'h-11 px-4 text-[15px] gap-2',   // 44px: comfortable touch target
}

// Primary actions use `primary`; one per view. `loading` keeps the label
// (so the button doesn't change width) and adds a spinner + aria-busy.
export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    type = 'button',
    children,
    ...rest
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={`inline-flex shrink-0 items-center justify-center rounded-control font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...rest}
        >
            {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {children}
        </button>
    )
}
