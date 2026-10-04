import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'

function timeAgo(dateStr) {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return 'Дөнгөж сая'
    if (diff < 3600) return `${Math.floor(diff / 60)} мин өмнө`
    if (diff < 86400) return `${Math.floor(diff / 3600)} цаг өмнө`
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} өдөр өмнө`
    return new Date(dateStr).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { colors } = useTheme()

    useEffect(() => {
        let isMounted = true
        async function fetchAnnouncements() {
            try {
                setLoading(true)
                setError(null)
                const data = await apiRequest('/api/announcements')
                if (!isMounted) return
                const items = Array.isArray(data) ? data : data?.announcements || []
                setAnnouncements(items)
            } catch (err) {
                if (!isMounted) return
                setError(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        fetchAnnouncements()
        return () => { isMounted = false }
    }, [])

    return (
        <div style={{ paddingTop: 24, paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>
                    Зарлал
                </h1>
                <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    СӨХ-ийн зарлал, мэдэгдлүүд
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: `3px solid ${colors.border}`,
                        borderTopColor: colors.primary,
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <p style={{ fontSize: 14, color: colors.textSecondary }}>Уншиж байна...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    padding: '14px 16px', borderRadius: 12, marginTop: 8,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#dc2626', fontSize: 14
                }}>
                    {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && announcements.length === 0 && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: 80, gap: 10
                }}>
                    <div style={{ fontSize: 48, opacity: 0.4 }}>📣</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: colors.textSecondary, margin: 0 }}>
                        Одоогоор зарлал байхгүй
                    </p>
                    <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0, opacity: 0.7 }}>
                        Шинэ зарлал гарахад энд харагдана
                    </p>
                </div>
            )}

            {/* List */}
            {!loading && !error && announcements.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {announcements.map((item) => (
                        <AnnouncementCard key={item._id || item.id} item={item} colors={colors} />
                    ))}
                </div>
            )}
        </div>
    )
}

function AnnouncementCard({ item, colors }) {
    return (
        <div style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
            {/* Top row: icon + time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: colors.primary + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0
                    }}>
                        📢
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: colors.primary,
                        background: colors.primary + '15',
                        padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                        Зарлал
                    </span>
                </div>
                {item.createdAt && (
                    <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        {timeAgo(item.createdAt)}
                    </span>
                )}
            </div>

            {/* Title */}
            <h2 style={{
                fontSize: 15, fontWeight: 700, color: colors.text,
                margin: '0 0 6px 0', lineHeight: 1.4
            }}>
                {item.title}
            </h2>

            {/* Content */}
            <p style={{
                fontSize: 14, color: colors.textSecondary,
                margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
                {item.content}
            </p>
        </div>
    )
}
