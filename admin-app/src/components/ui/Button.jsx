import { Loader2 } from 'lucide-react'

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'

const VARIANTS = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  success: 'bg-brand text-on-brand hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-muted hover:border-line-strong/50',
  danger: 'bg-surface text-danger-text border border-line hover:bg-danger-bg hover:border-danger-bg',
  dangerSolid: 'bg-danger-text text-white hover:brightness-110',
  ghost: 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
  dangerGhost: 'text-danger-text hover:bg-danger-bg',
}

const SIZES = {
  sm: 'text-xs h-8 px-3 rounded-[8px] gap-1.5',
  md: 'text-sm h-10 px-4 rounded-control gap-2',
}

function Spinner({ className = '' }) {
  return <Loader2 aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`} />
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {loading && <Spinner className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  )
}

export { Spinner }
