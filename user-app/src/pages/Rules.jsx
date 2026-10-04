import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../context/ThemeContext'
import { apiRequest } from '../api/client'
import { ShieldCheck } from 'lucide-react'

export default function Rules() {
    const headerRef = useRef(null)
    const rulesRef = useRef([])

    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const data = await apiRequest('/api/rules')
                if (active) setRules(Array.isArray(data) ? data : [])
            } catch (err) {
                if (active) setError(err.message || 'Дүрэм ачаалахад алдаа гарлаа.')
            } finally {
                if (active) setLoading(false)
            }
        })()
        return () => { active = false }
    }, [])

    useEffect(() => {
        gsap.from(headerRef.current, {
            y: -20, opacity: 0, duration: 0.5, ease: 'power2.out'
        })
    }, [])

    useEffect(() => {
        if (!loading && rulesRef.current.length) {
            gsap.from(rulesRef.current.filter(Boolean), {
                y: 20, opacity: 0, stagger: 0.1, duration: 0.4, delay: 0.1, ease: 'power1.out'
            })
        }
    }, [loading, rules])

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px 0 80px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSubtitle: { fontSize: '14px', color: colors.textMuted },
        ruleSection: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
            marginBottom: '16px', boxShadow: `0 2px 4px ${colors.shadow}`,
            border: `1px solid ${colors.border}`,
        },
        ruleTitle: {
            fontSize: '18px', fontWeight: '600', color: colors.text,
            marginBottom: '16px', display: 'flex', alignItems: 'center',
        },
        ruleIcon: { width: '24px', height: '24px', marginRight: '8px', color: colors.accent },
        ruleList: { listStyle: 'none', padding: '0', margin: '0' },
        ruleItem: {
            display: 'flex', alignItems: 'flex-start', marginBottom: '12px',
            fontSize: '15px', color: colors.textSub, lineHeight: '1.5',
        },
        bulletPoint: {
            minWidth: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: colors.accentBg, color: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: '12px', fontSize: '12px', fontWeight: '600',
        },
        note: {
            fontSize: '14px', color: colors.textMuted,
            backgroundColor: colors.surfaceAlt, padding: '12px 16px',
            borderRadius: '8px', marginTop: '16px', borderLeft: `3px solid ${colors.accent}`,
        },
        stateBox: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '32px 16px',
            border: `1px solid ${colors.border}`, textAlign: 'center', color: colors.textMuted, fontSize: '14px',
        },
        errorBox: {
            backgroundColor: '#fef2f2', borderRadius: '12px', padding: '16px',
            border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px',
        },
    };

    return (
        <div style={styles.container}>
            <header ref={headerRef} style={styles.header}>
                <h1 style={styles.headerTitle}>Орон сууцны дүрэм</h1>
                <p style={styles.headerSubtitle}>Хамтдаа амар тайван, аюулгүй орчинд амьдрах дүрмүүд</p>
            </header>

            {loading ? (
                <div style={styles.stateBox}>Ачаалж байна...</div>
            ) : error ? (
                <div style={styles.errorBox}>{error}</div>
            ) : rules.length === 0 ? (
                <div style={styles.stateBox}>Дүрэм одоогоор бүртгэгдээгүй байна.</div>
            ) : (
                <div>
                    {rules.map((ruleSection, index) => (
                        <div
                            key={ruleSection._id}
                            style={styles.ruleSection}
                            ref={el => rulesRef.current[index] = el}
                        >
                            <h2 style={styles.ruleTitle}>
                                <ShieldCheck style={styles.ruleIcon} />
                                {ruleSection.title}
                            </h2>

                            {ruleSection.items?.length > 0 && (
                                <ul style={styles.ruleList}>
                                    {ruleSection.items.map((item, idx) => (
                                        <li key={idx} style={styles.ruleItem}>
                                            <span style={styles.bulletPoint}>{idx + 1}</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}

                    <div style={styles.note}>
                        <p>Тайлбар: Дээрх дүрмүүд нь орон сууцны хамтын амьдралыг зохицуулах үндсэн дүрмүүд болно.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
