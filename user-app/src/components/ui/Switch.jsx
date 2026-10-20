import { FOCUS_RING } from './Button'

// Accessible on/off switch: a real <button role="switch"> (Space/Enter work,
// state is announced). `labelledBy` points at the visible label's id.
export default function Switch({ checked, onChange, labelledBy, label, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50 ${FOCUS_RING} ${
                checked ? 'bg-brand' : 'bg-line-strong/60'
            }`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-150 motion-reduce:transition-none ${
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
            />
        </button>
    )
}
