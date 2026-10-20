import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { FOCUS_RING } from './Button'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    panelRef.current?.focus()
    function onKeyDown(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_150ms_ease-out]"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`bg-surface text-ink rounded-card shadow-pop w-full ${maxWidth} max-h-[85vh] overflow-y-auto overscroll-contain focus:outline-none animate-[modalIn_150ms_ease-out]`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface rounded-t-card z-10">
            <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors ${FOCUS_RING}`}
              aria-label="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
