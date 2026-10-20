import { useState, useEffect } from 'react'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { ShieldCheck, ScrollText, AlertCircle, Info } from 'lucide-react'

export default function Rules() {
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

    return (
        <div className="pb-4 pt-2">
            <PageHeader title="Орон сууцны дүрэм" description="Хамтдаа амар тайван, аюулгүй орчинд амьдрах дүрмүүд" />

            {loading ? (
                <div className="space-y-3">
                    <SkeletonBlock className="h-40 rounded-card" />
                    <SkeletonBlock className="h-32 rounded-card" />
                </div>
            ) : error ? (
                <Card><EmptyState tone="error" icon={AlertCircle} title="Дүрэм ачаалж чадсангүй" description={error} className="py-6" /></Card>
            ) : rules.length === 0 ? (
                <Card><EmptyState icon={ScrollText} title="Дүрэм бүртгэгдээгүй байна" description="СӨХ-ийн админ дүрэм нэмэхэд энд харагдана." className="py-6" /></Card>
            ) : (
                <div className="space-y-3">
                    {rules.map(section => (
                        <Card as="section" key={section._id} aria-labelledby={`rule-${section._id}`}>
                            <h2 id={`rule-${section._id}`} className="mb-4 flex items-center gap-3 text-base font-semibold text-ink">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                    <ShieldCheck size={20} aria-hidden="true" />
                                </span>
                                {section.title}
                            </h2>
                            {section.items?.length > 0 && (
                                <ol className="space-y-3">
                                    {section.items.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-secondary">
                                            <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold tabular-nums text-ink-secondary">
                                                {idx + 1}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </Card>
                    ))}

                    <p className="flex items-start gap-2 rounded-card bg-surface-muted px-4 py-3 text-sm text-ink-muted">
                        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        Дээрх дүрмүүд нь орон сууцны хамтын амьдралыг зохицуулах үндсэн дүрмүүд болно.
                    </p>
                </div>
            )}
        </div>
    )
}
