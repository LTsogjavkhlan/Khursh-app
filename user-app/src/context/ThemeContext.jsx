import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

/* ─── Color map ─────────────────────────────────────────────── */
export const LIGHT = {
    bg:          '#f9fafb',
    surface:     '#ffffff',
    surfaceAlt:  '#f3f4f6',
    surfaceInfo: '#eff6ff',
    text:        '#111827',
    textSub:     '#4b5563',
    textMuted:   '#6b7280',
    border:      '#e5e7eb',
    accent:      '#2563eb',
    accentBg:    '#eff6ff',
    accentText:  '#1d4ed8',
    shadow:      'rgba(0,0,0,0.06)',
    overlay:     'rgba(0,0,0,0.3)',
}

export const DARK = {
    bg:          '#0f172a',
    surface:     '#1e293b',
    surfaceAlt:  '#334155',
    surfaceInfo: '#1e3a5f',
    text:        '#f1f5f9',
    textSub:     '#cbd5e1',
    textMuted:   '#94a3b8',
    border:      '#334155',
    accent:      '#3b82f6',
    accentBg:    '#1e3a5f',
    accentText:  '#93c5fd',
    shadow:      'rgba(0,0,0,0.3)',
    overlay:     'rgba(0,0,0,0.6)',
}

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('theme') === 'dark' }
        catch { return false }
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark)
        try { localStorage.setItem('theme', isDark ? 'dark' : 'light') }
        catch { /* ignore */ }
    }, [isDark])

    const toggleDark = () => setIsDark(d => !d)
    const colors = isDark ? DARK : LIGHT

    return (
        <ThemeContext.Provider value={{ isDark, toggleDark, colors }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}
