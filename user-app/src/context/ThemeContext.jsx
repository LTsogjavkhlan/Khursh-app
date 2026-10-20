import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

/* ─── Color map ─────────────────────────────────────────────
   Every value is a reference to a design token in styles/tokens.css, so the
   same map serves light and dark mode: the `dark` class on <html> switches
   the underlying variables. Don't do string maths on these values (e.g.
   appending hex alpha) — use a dedicated token instead. */
const COLORS = {
    bg:          'var(--canvas)',
    surface:     'var(--surface)',
    surfaceAlt:  'var(--surface-muted)',
    surfaceInfo: 'var(--info-bg)',
    text:        'var(--ink)',
    textSub:     'var(--ink-secondary)',
    textMuted:   'var(--ink-muted)',
    border:      'var(--line)',
    borderStrong:'var(--line-strong)',
    accent:      'var(--brand-text)',   // brand-coloured text, icons, borders
    accentBg:    'var(--brand-soft)',   // tinted brand background
    accentText:  'var(--brand-text)',
    brand:       'var(--brand)',        // solid brand fill (use with onBrand text)
    onBrand:     'var(--on-brand)',
    shadow:      'var(--shadow-color)',
    overlay:     'var(--overlay)',
    // Aliases for keys some pages used without them ever being defined
    textSecondary: 'var(--ink-muted)',
    primary:     'var(--brand-text)',
    card:        'var(--surface)',
}

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('theme') === 'dark' }
        catch { return false }
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark)
        // Browser chrome (mobile address bar) follows the app theme, not the OS
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0F1513' : '#F6F5F1')
        try { localStorage.setItem('theme', isDark ? 'dark' : 'light') }
        catch { /* ignore */ }
    }, [isDark])

    const toggleDark = () => setIsDark(d => !d)
    const colors = COLORS

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
