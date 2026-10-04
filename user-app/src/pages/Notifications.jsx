import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { CircleDollarSign, Megaphone, MessageSquare, Calendar, Wrench, KeyRound, Package, Info } from 'lucide-react'

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

        const icons = {
            payment: CircleDollarSign,
            announcement: Megaphone,
            feedback: MessageSquare,
            event: Calendar,
            maintenance: Wrench,
            access: KeyRound,
            package: Package,
        }
        const Icon = icons[type] || Info

        return (
            <div style={iconStyle.container}>
                <Icon style={iconStyle.icon} />
            </div>
        )
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