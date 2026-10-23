import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { FOCUS_RING } from '../components/ui/Button'
import ReportView from '../components/ReportView'
import { dayLabel } from '../utils/format'
import { periodLabel } from '../utils/reports'
import { FileBarChart2, AlertCircle, ChevronRight } from 'lucide-react'

// /reports      → the latest published report, then earlier ones
// /reports/:id  → that report, then the others
export default function Reports() {
    const { id } = useParams()
    const [reports, setReports] = useState([])
    const [current, setCurrent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        let active = true
        setLoading(true); setError(null); setNotFound(false)
        ;(async () => {
            try {
                const list = await apiRequest('/api/reports')
                const all = Array.isArray(list) ? list : []
                let shown = id ? all.find(r => r._id === id) : all[0]
                // Older than the list window (or a stale link): ask for it directly
                if (id && !shown) {
                    try { shown = await apiRequest(`/api/reports/${id}`) } catch { shown = null }
                }
                if (!active) return
                setReports(all)
                setCurrent(shown || null)
                setNotFound(Boolean(id) && !shown)
            } catch (err) {
                if (active) setError(err.message || 'Тайлан ачаалахад алдаа гарлаа.')
            } finally {
                if (active) setLoading(false)
            }
        })()
        return () => { active = false }
    }, [id])

    // Opening another report starts at its top
    useEffect(() => { window.scrollTo(0, 0) }, [id])

    const others = reports.filter(r => r._id !== current?._id)

    return (
        <div className="pb-4 pt-2">
            <PageHeader title="Тайлан" description="СӨХ юу хийж, хөрөнгө хэрхэн зарцуулсныг эндээс харна." />

            {loading ? (
                <div className="space-y-3">
                    <SkeletonBlock className="h-36 rounded-[24px]" />
                    <SkeletonBlock className="h-28 rounded-card" />
                    <SkeletonBlock className="h-40 rounded-card" />
                </div>
            ) : error ? (
                <Card><EmptyState tone="error" icon={AlertCircle} title="Тайлан ачаалж чадсангүй" description={error} className="py-6" /></Card>
            ) : !current && !notFound ? (
                <Card><EmptyState icon={FileBarChart2} title="Тайлан хараахан нийтлэгдээгүй байна" description="СӨХ тайлан нийтлэхэд энд харагдана." className="py-6" /></Card>
            ) : (
                <div className="space-y-8">
                    {notFound ? (
                        <Card><EmptyState icon={FileBarChart2} title="Энэ тайлан олдсонгүй" description="Тайланг нийтлэлээс хассан эсвэл устгасан байж магадгүй." className="py-6" /></Card>
                    ) : (
                        <ReportView report={current} headingLevel={2} />
                    )}

                    {others.length > 0 && (
                        <section aria-labelledby="other-reports">
                            <h2 id="other-reports" className="mb-3 text-[15px] font-semibold text-ink-muted">{notFound ? 'Нийтлэгдсэн тайлангууд' : 'Өмнөх тайлангууд'}</h2>
                            <Card padded={false}>
                                <ul className="divide-y divide-line">
                                    {others.map(r => (
                                        <li key={r._id}>
                                            <Link to={`/reports/${r._id}`} className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted ${FOCUS_RING}`}>
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                                    <FileBarChart2 size={19} aria-hidden="true" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[15px] font-semibold text-ink">{r.title}</span>
                                                    <span className="block truncate text-xs text-ink-muted">
                                                        {periodLabel(r.periodStart, r.periodEnd) || (r.publishedAt ? `${dayLabel(r.publishedAt)}-нд нийтэлсэн` : '')}
                                                    </span>
                                                </span>
                                                <ChevronRight size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
