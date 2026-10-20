import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((message, tone) => {
    const id = ++idCounter
    setToasts(prev => [...prev, { id, message, tone }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  const api = useMemo(() => ({
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Always mounted so screen readers announce new messages */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none w-[calc(100%-2rem)] max-w-md"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-[toastIn_150ms_ease-out] px-4 py-3 rounded-control text-sm font-medium shadow-pop pointer-events-auto text-center ${
              t.tone === 'error' ? 'bg-danger-text text-white' : 'bg-ink text-surface'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
