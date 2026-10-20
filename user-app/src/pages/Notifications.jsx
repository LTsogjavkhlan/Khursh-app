import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { relativeTime } from '../utils/format'
import { CircleDollarSign, Megaphone, MessageSquare, Calendar, Wrench, KeyRound, Package, Info, Bell, ChevronRight, CheckCheck } from 'lucide-react'

// Icon + tint per notification type (decorative; the title says what it is)
const TYPES = {
    payment: { icon: CircleDollarSign, tint: 'bg-success-bg text-success-text' },
    announcement: { icon: Megaphone, tint: 'bg-info-bg text-info-text' },
    feedback: { icon: MessageSquare, tint: 'bg-warning-bg text-warning-text' },
    event: { icon: Calendar, tint: 'bg-brand-soft text-brand-text' },
    maintenance: { icon: Wrench, tint: 'bg-warning-bg text-warning-text' },
    access: { icon: KeyRound, tint: 'bg-brand-soft text-brand-text' },
    package: { icon: Package, tint: 'bg-warning-bg text-warning-text' },
}

export default function Notifications() {
    const navigate = useNavigate()
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

    useEffect(() => {
        loadNotifications()
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

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="pb-4 pt-2">
            <PageHeader
                title="Мэдэгдэл"
                description={unreadCount ? `${unreadCount} уншаагүй мэдэгдэл` : 'Сүүлийн үеийн мэдээлэл'}
                action={unreadCount > 0 && (
                    <Button variant="soft" size="sm" onClick={markAllAsRead}>
                        <CheckCheck size={16} aria-hidden="true" /> Бүгдийг уншсан
                    </Button>
                )}
            />

            {loading ? (
                <div className="space-y-3">
                    <SkeletonBlock className="h-20 rounded-card" />
                    <SkeletonBlock className="h-20 rounded-card" />
                    <SkeletonBlock className="h-20 rounded-card" />
                </div>
            ) : notifications.length === 0 ? (
                <Card><EmptyState icon={Bell} title="Мэдэгдэл алга" description="Шинэ мэдэгдэл ирэхэд энд харагдана." className="py-6" /></Card>
            ) : (
                <Card padded={false}>
                    <ul className="divide-y divide-line">
                        {notifications.map(notification => {
                            const type = TYPES[notification.type] || { icon: Info, tint: 'bg-surface-muted text-ink-secondary' }
                            const Icon = type.icon
                            const unread = !notification.isRead
                            return (
                                <li key={notification._id}>
                                    <button
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none ${
                                            unread ? 'bg-brand-soft/40' : ''
                                        }`}
                                    >
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${type.tint}`}>
                                            <Icon size={19} aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-2">
                                                <span className={`text-[15px] leading-snug ${unread ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                                                    {unread && <span className="sr-only">Шинэ: </span>}
                                                    {notification.title}
                                                </span>
                                                <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-ink-muted">
                                                    {notification.createdAt ? relativeTime(notification.createdAt) : ''}
                                                    {unread && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-text" />}
                                                </span>
                                            </span>
                                            <span className={`mt-1 block text-sm leading-relaxed ${unread ? 'text-ink-secondary' : 'text-ink-muted'}`}>
                                                {notification.message}
                                            </span>
                                            {notification.type === 'feedback' && (
                                                <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-text">
                                                    Миний гомдлууд харах <ChevronRight size={14} aria-hidden="true" />
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </Card>
            )}
        </div>
    )
}
