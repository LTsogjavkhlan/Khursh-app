import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../context/ThemeContext'
import { apiRequest } from '../api/client'

const CATEGORY_META = {
    hoa:         { label: 'СӨХ',            icon: '🏢' },
    heating:     { label: 'Дулаан',         icon: '🔥' },
    electricity: { label: 'Цахилгаан',      icon: '⚡' },
    water:       { label: 'Ус, сантехник',  icon: '💧' },
    plumbing:    { label: 'Сантехник',      icon: '🔧' },
    elevator:    { label: 'Цахилгаан шат',  icon: '🛗' },
    security:    { label: 'Хамгаалалт',     icon: '🛡️' },
    internet:    { label: 'Интернэт',       icon: '🌐' },
    other:       { label: 'Бусад',          icon: '📞' },
}

export default function Contact() {
    const headerRef = useRef(null)
    const contentRef = useRef(null)
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const data = await apiRequest('/api/contacts')
                if (active) setContacts(Array.isArray(data) ? data : [])
            } catch (err) {
                if (active) setError(err.message || 'Мэдээлэл ачаалахад алдаа гарлаа.')
            } finally {
                if (active) setLoading(false)
            }
        })()
        return () => { active = false }
    }, [])

    useEffect(() => {
        const headerAnim = gsap.from(headerRef.current, {
            y: -20, opacity: 0, duration: 0.5, ease: 'power2.out'
        })
        return () => { headerAnim.kill() }
    }, [])

    useEffect(() => {
        if (!loading && contentRef.current) {
            const anim = gsap.from(contentRef.current, {
                y: 20, opacity: 0, duration: 0.5, ease: 'power1.out'
            })
            return () => { anim.kill() }
        }
    }, [loading])

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px', paddingBottom: '72px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text },
        headerSubtitle: { color: colors.textMuted, marginTop: '4px' },
        contactGroup: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '16px',
            marginBottom: '16px', boxShadow: `0 1px 3px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        groupHeader: {
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px',
        },
        groupIcon: { fontSize: '20px', lineHeight: 1 },
        groupTitleWrap: { display: 'flex', flexDirection: 'column' },
        contactGroupTitle: { fontSize: '17px', fontWeight: '600', color: colors.text },
        categoryTag: { fontSize: '12px', color: colors.textMuted, marginTop: '2px' },
        contactItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
        contactLabel: { fontSize: '14px', color: colors.textMuted, fontWeight: '500' },
        contactValue: { fontSize: '15px', color: colors.text, fontWeight: '500', textDecoration: 'none' },
        contactLink: { fontSize: '15px', color: colors.accent, fontWeight: '500', textDecoration: 'none' },
        description: { fontSize: '14px', color: colors.textMuted, marginTop: '8px', lineHeight: 1.5 },
        stateBox: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '32px 16px',
            border: `1px solid ${colors.border}`, textAlign: 'center', color: colors.textMuted, fontSize: '14px',
        },
        errorBox: {
            backgroundColor: '#fef2f2', borderRadius: '12px', padding: '16px',
            border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px',
        },
    }

    return (
        <div style={styles.container}>
            <header style={styles.header} ref={headerRef}>
                <h1 style={styles.headerTitle}>Холбоо барих</h1>
                <p style={styles.headerSubtitle}>Холбогдох дугаарууд</p>
            </header>

            {loading ? (
                <div style={styles.stateBox}>Ачаалж байна...</div>
            ) : error ? (
                <div style={styles.errorBox}>{error}</div>
            ) : contacts.length === 0 ? (
                <div style={styles.stateBox}>Холбоо барих мэдээлэл одоогоор бүртгэгдээгүй байна.</div>
            ) : (
                <div ref={contentRef}>
                    {contacts.map(item => {
                        const meta = CATEGORY_META[item.category] || CATEGORY_META.other
                        return (
                            <div key={item._id} style={styles.contactGroup}>
                                <div style={styles.groupHeader}>
                                    <span style={styles.groupIcon}>{meta.icon}</span>
                                    <div style={styles.groupTitleWrap}>
                                        <span style={styles.contactGroupTitle}>{item.name}</span>
                                        <span style={styles.categoryTag}>{meta.label}</span>
                                    </div>
                                </div>

                                {item.phone && (
                                    <div style={styles.contactItem}>
                                        <span style={styles.contactLabel}>Утас:</span>
                                        <a href={`tel:${item.phone.replace(/\s/g, '')}`} style={styles.contactLink}>{item.phone}</a>
                                    </div>
                                )}
                                {item.email && (
                                    <div style={styles.contactItem}>
                                        <span style={styles.contactLabel}>Цахим шуудан:</span>
                                        <a href={`mailto:${item.email}`} style={styles.contactLink}>{item.email}</a>
                                    </div>
                                )}
                                {item.description && (
                                    <p style={styles.description}>{item.description}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
