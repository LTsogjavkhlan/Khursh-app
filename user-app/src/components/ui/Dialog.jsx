import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { FOCUS_RING } from './Button'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Accessible modal. `variant="sheet"` slides up from the bottom (mobile
// pattern); `variant="center"` is a centred dialog. Handles Escape, focus
// trap, focus return, background scroll lock and reduced motion.
export default function Dialog({ open, onClose, title, description, variant = 'sheet', children, footer }) {
    const panelRef = useRef(null)
    const titleId = useId()
    const descId = useId()

    useEffect(() => {
        if (!open) return
        const previouslyFocused = document.activeElement
        const panel = panelRef.current
        ;(panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE) || panel)?.focus()

        const onKeyDown = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose?.() }
            if (e.key !== 'Tab' || !panel) return
            const items = [...panel.querySelectorAll(FOCUSABLE)]
            if (items.length === 0) { e.preventDefault(); return }
            const first = items[0], last = items[items.length - 1]
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        }
        document.addEventListener('keydown', onKeyDown)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prevOverflow
            previouslyFocused?.focus?.()
        }
    }, [open, onClose])

    if (!open) return null

    const sheet = variant === 'sheet'
    return (
        <div className={`fixed inset-0 z-[200] flex justify-center ${sheet ? 'items-end' : 'items-center p-4'}`}>
            <div aria-hidden="true" className="shell-fade absolute inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={onClose} />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={`relative w-full overflow-y-auto overscroll-contain bg-surface text-ink shadow-pop focus:outline-none ${
                    sheet
                        ? 'shell-sheet max-h-[88vh] max-w-lg rounded-t-[20px] pb-[env(safe-area-inset-bottom)]'
                        : 'dialog-pop max-h-[85vh] max-w-md rounded-card'
                }`}
            >
                {sheet && <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />}
                {(title || onClose) && (
                    <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
                        <div className="min-w-0">
                            {title && <h2 id={titleId} className="text-lg font-semibold text-ink">{title}</h2>}
                            {description && <p id={descId} className="mt-0.5 text-sm text-ink-muted">{description}</p>}
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Хаах"
                                className={`-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink ${FOCUS_RING}`}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="px-5 pb-5">{children}</div>
                {footer && <div className="flex gap-2 border-t border-line px-5 py-4">{footer}</div>}
            </div>
        </div>
    )
}
