import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'

export default function Notifications() {
    const navigate = useNavigate()
    const headerRef = useRef(null)
    const notificationsRef = useRef([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    const loadNotifications = async () => {
        try {
            const data = await apiRequest('/api/notifications')
            setNotifications(Array.isArray(data) ? data : [])
        } catch {
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (dateStr) => {
        const d = new Date(dateStr)
        const now = new Date()
        const diffMs = now - d
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        if (diffMins < 60) return `${diffMins} минутын өмнө`
        if (diffHours < 24) return `${diffHours} цагийн өмнө`
        if (diffDays === 1) return 'Өчигдөр'
        return `${diffDays} өдрийн өмнө`
    }

    useEffect(() => {
        loadNotifications()
    }, [])

    useEffect(() => {
        gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        })

        gsap.from(notificationsRef.current, {
            y: 20,
            opacity: 0,
            stagger: 0.1,
            duration: 0.5,
            delay: 0.2,
            ease: "power1.out"
        })
    }, [])

    const markAllAsRead = async () => {
        try {
            await apiRequest('/api/notifications/read-all', { method: 'PUT' })
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        } catch {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        }
    }

    const markOneAsRead = async (id) => {
        try {
            await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' })
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n))
        } catch { /* ignore */ }
    }

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markOneAsRead(notification._id)
        }
        if (notification.type === 'feedback') {
            navigate('/feedback', { state: { tab: 'history' } })
        }
    }

    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        const iconColors = {
            payment: {
                bg: '#DCFCE7',
                color: '#16A34A'
            },
            announcement: {
                bg: '#DBEAFE',
                color: '#2563EB'
            },
            feedback: {
                bg: '#FEF3C7',
                color: '#D97706'
            },
            event: {
                bg: '#F3E8FF',
                color: '#9333EA'
            },
            maintenance: {
                bg: '#FEF3C7',
                color: '#D97706'
            },
            access: {
                bg: '#F3E8FF',
                color: '#9333EA'
            },
            package: {
                bg: '#FEF9C3',
                color: '#CA8A04'
            }
        };

        const color = iconColors[type] || { bg: '#F3F4F6', color: '#6B7280' };

        const iconStyle = {
            container: {
                backgroundColor: color.bg,
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            },
            icon: {
                width: '20px',
                height: '20px',
                color: color.color
            }
        };

        switch (type) {
            case 'payment':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
            case 'announcement':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                )
            case 'feedback':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                )
            case 'event':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )
            case 'maintenance':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="blue-text">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                )
            case 'access':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="blue-text">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                )
            case 'package':
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="blue-text">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                    </div>
                )
            default:
                return (
                    <div style={iconStyle.container}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="blue-text">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
        }
    }

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px 0 80px' },
        header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSubtitle: { fontSize: '14px', color: colors.textMuted },
        markAllButton: {
            fontSize: '14px', color: colors.accent, padding: '8px 12px',
            backgroundColor: colors.accentBg, borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: '500',
        },
        notificationsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
        notificationItem: {
            display: 'flex', padding: '16px', backgroundColor: colors.surface,
            borderRadius: '12px', boxShadow: `0 2px 4px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        notificationItemUnread: { borderLeft: `4px solid ${colors.accent}` },
        iconContainer: { marginRight: '16px', marginTop: '4px' },
        contentContainer: { flex: 1 },
        notificationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' },
        notificationTitle: { fontWeight: '500', fontSize: '16px', color: colors.text },
        notificationTitleUnread: { fontWeight: '600', color: colors.text },
        notificationTime: { fontSize: '12px', color: colors.textMuted },
        notificationTimeUnread: { color: colors.textSub },
        notificationMessage: { fontSize: '14px', color: colors.textMuted, lineHeight: '1.4' },
        notificationMessageUnread: { color: colors.textSub },
    };

    return (
        <div style={styles.container}>
            <header ref={headerRef} style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Мэдэгдлүүд</h1>
                    <p style={styles.headerSubtitle}>Сүүлийн үеийн мэдээллийг хүлээн авах</p>
                </div>
                <button
                    style={styles.markAllButton}
                    onClick={markAllAsRead}
                >
                    Бүгдийг уншсан
                </button>
            </header>

            <div style={styles.notificationsList}>
                {loading ? (
                    <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '20px' }}>Ачаалж байна...</p>
                ) : notifications.length === 0 ? (
                    <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '20px' }}>Мэдэгдэл байхгүй байна.</p>
                ) : notifications.map((notification, index) => (
                    <div
                        key={notification._id}
                        ref={el => notificationsRef.current[index] = el}
                        style={{
                            ...styles.notificationItem,
                            ...(!notification.isRead ? styles.notificationItemUnread : {}),
                            cursor: notification.type === 'feedback' ? 'pointer' : (!notification.isRead ? 'pointer' : 'default'),
                        }}
                        onClick={() => handleNotificationClick(notification)}
                    >
                        <div style={styles.iconContainer}>
                            {getNotificationIcon(notification.type)}
                        </div>
                        <div style={styles.contentContainer}>
                            <div style={styles.notificationHeader}>
                                <h3 style={{
                                    ...styles.notificationTitle,
                                    ...(!notification.isRead ? styles.notificationTitleUnread : {})
                                }}>
                                    {notification.title}
                                </h3>
                                <span style={{
                                    ...styles.notificationTime,
                                    ...(!notification.isRead ? styles.notificationTimeUnread : {})
                                }}>
                                    {notification.createdAt ? formatTime(notification.createdAt) : ''}
                                </span>
                            </div>
                            <p style={{
                                ...styles.notificationMessage,
                                ...(!notification.isRead ? styles.notificationMessageUnread : {})
                            }}>
                                {notification.message}
                            </p>
                            {notification.type === 'feedback' && (
                                <p style={{ fontSize: '12px', color: '#2563EB', marginTop: '6px', fontWeight: '500' }}>
                                    Миний гомдлууд харах →
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 