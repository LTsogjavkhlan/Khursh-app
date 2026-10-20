import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { relativeTime } from '../utils/format'
import { Megaphone, AlertCircle } from 'lucide-react'

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
        <div className="pb-4 pt-2">
            <PageHeader title="Зарлал" description="СӨХ-ийн зарлал, мэдээлэл" />

            {loading ? (
                <div className="space-y-3">
                    <SkeletonBlock className="h-32 rounded-card" />
                    <SkeletonBlock className="h-32 rounded-card" />
                </div>
            ) : error ? (
                <Card><EmptyState tone="error" icon={AlertCircle} title="Зарлал ачаалж чадсангүй" description={error} className="py-6" /></Card>
            ) : announcements.length === 0 ? (
                <Card><EmptyState icon={Megaphone} title="Одоогоор зарлал алга" description="Шинэ зарлал гарахад энд харагдана." className="py-6" /></Card>
            ) : (
                <ul className="space-y-3">
                    {announcements.map(item => (
                        <li key={item._id || item.id}>
                            <Card as="article">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                            <Megaphone size={17} aria-hidden="true" />
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-text">Зарлал</span>
                                    </span>
                                    {item.createdAt && <time dateTime={item.createdAt} className="text-xs text-ink-muted">{relativeTime(item.createdAt)}</time>}
                                </div>
                                <h2 className="text-base font-semibold leading-snug text-ink text-balance">{item.title}</h2>
                                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{item.content}</p>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
