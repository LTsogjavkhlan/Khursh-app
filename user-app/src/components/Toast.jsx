import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

// Lightweight toast: one message at a time, floating above the bottom nav.
// The region is always mounted with aria-live so screen readers announce it.
export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null)
    const timer = useRef(null)

    const show = useCallback((message) => {
        clearTimeout(timer.current)
        setToast({ message, id: Date.now() })
        timer.current = setTimeout(() => setToast(null), 2800)
    }, [])

    const api = useMemo(() => ({ show }), [show])

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                role="status"
                aria-live="polite"
                style={{
                    position: 'fixed', left: '16px', right: '16px', zIndex: 300,
                    bottom: 'calc(88px + env(safe-area-inset-bottom))',
                    display: 'flex', justifyContent: 'center', pointerEvents: 'none',
                }}
            >
                {toast && (
                    <div
                        key={toast.id}
                        className="app-toast"
                        style={{
                            maxWidth: '420px', padding: '12px 16px', borderRadius: '14px',
                            backgroundColor: '#1f2937', color: 'white', fontSize: '14px',
                            fontWeight: 500, lineHeight: 1.4, textAlign: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                        }}
                    >
                        {toast.message}
                    </div>
                )}
            </div>
            <style>{`
                .app-toast { animation: app-toast-in 180ms ease-out; }
                @keyframes app-toast-in { from { transform: translateY(8px); } to { transform: translateY(0); } }
                @media (prefers-reduced-motion: reduce) { .app-toast { animation: none; } }
            `}</style>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}
