import { CheckCircle2, Clock, AlertCircle, Info, Circle } from 'lucide-react'

// Status is shown with text AND an icon, never colour alone.
const TONES = {
    success: { cls: 'bg-success-bg text-success-text', Icon: CheckCircle2 },
    warning: { cls: 'bg-warning-bg text-warning-text', Icon: Clock },
    danger: { cls: 'bg-danger-bg text-danger-text', Icon: AlertCircle },
    info: { cls: 'bg-info-bg text-info-text', Icon: Info },
    neutral: { cls: 'bg-surface-muted text-ink-secondary', Icon: Circle },
}

export default function StatusPill({ tone = 'neutral', icon = true, className = '', children }) {
    const { cls, Icon } = TONES[tone] || TONES.neutral
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls} ${className}`}>
            {icon && <Icon aria-hidden="true" size={13} strokeWidth={2.4} />}
            {children}
        </span>
    )
}
