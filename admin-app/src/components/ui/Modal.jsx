import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { FOCUS_RING } from './Button'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null)
  const titleId = useId()
  // Parents usually pass an inline onClose; keep it in a ref so the effect
  // below runs only on open/close — re-running it on every render would pull
  // focus out of the field being typed in.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    panelRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') { onCloseRef.current?.(); return }
      // Keep Tab focus inside the dialog
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

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
