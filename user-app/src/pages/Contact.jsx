import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { FOCUS_RING } from '../components/ui/Button'
import { Building2, Flame, Zap, Droplets, Wrench, ArrowUpDown, ShieldCheck, Wifi, PhoneCall, Phone, Mail, AlertCircle, BookUser } from 'lucide-react'

const CATEGORY_META = {
    hoa:         { label: 'СӨХ',            icon: Building2,   tint: 'bg-brand-soft text-brand-text' },
    heating:     { label: 'Дулаан',         icon: Flame,       tint: 'bg-danger-bg text-danger-text' },
    electricity: { label: 'Цахилгаан',      icon: Zap,         tint: 'bg-warning-bg text-warning-text' },
    water:       { label: 'Ус, сантехник',  icon: Droplets,    tint: 'bg-info-bg text-info-text' },
    plumbing:    { label: 'Сантехник',      icon: Wrench,      tint: 'bg-info-bg text-info-text' },
    elevator:    { label: 'Цахилгаан шат',  icon: ArrowUpDown, tint: 'bg-surface-muted text-ink-secondary' },
    security:    { label: 'Хамгаалалт',     icon: ShieldCheck, tint: 'bg-success-bg text-success-text' },
    internet:    { label: 'Интернэт',       icon: Wifi,        tint: 'bg-info-bg text-info-text' },
    other:       { label: 'Бусад',          icon: PhoneCall,   tint: 'bg-surface-muted text-ink-secondary' },
}

const ACTION_CLS = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${FOCUS_RING}`

export default function Contact() {
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

    return (
        <div className="pb-4 pt-2">
            <PageHeader title="Холбоо барих" description="СӨХ болон үйлчилгээний байгууллагын дугаарууд" />

            {loading ? (
                <div className="space-y-3">
                    <SkeletonBlock className="h-24 rounded-card" />
                    <SkeletonBlock className="h-24 rounded-card" />
                </div>
            ) : error ? (
                <Card><EmptyState tone="error" icon={AlertCircle} title="Мэдээлэл ачаалж чадсангүй" description={error} className="py-6" /></Card>
            ) : contacts.length === 0 ? (
                <Card><EmptyState icon={BookUser} title="Холбоо барих мэдээлэл алга" description="СӨХ-ийн админ бүртгэсний дараа энд харагдана." className="py-6" /></Card>
            ) : (
                <ul className="space-y-3">
                    {contacts.map(item => {
                        const meta = CATEGORY_META[item.category] || CATEGORY_META.other
                        const Icon = meta.icon
                        return (
                            <li key={item._id}>
                                <Card>
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                                            <Icon size={22} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-[15px] font-semibold leading-snug text-ink">{item.name}</h2>
                                            <p className="text-xs text-ink-muted">{meta.label}</p>
                                        </div>
                                        {item.email && (
                                            <a href={`mailto:${item.email}`} aria-label={`${item.name} руу имэйл бичих`} className={`${ACTION_CLS} bg-surface-muted text-ink-secondary hover:bg-line`}>
                                                <Mail size={19} aria-hidden="true" />
                                            </a>
                                        )}
                                        {item.phone && (
                                            <a href={`tel:${item.phone.replace(/\s/g, '')}`} aria-label={`${item.name} руу залгах`} className={`${ACTION_CLS} bg-brand text-on-brand hover:bg-brand-hover`}>
                                                <Phone size={19} aria-hidden="true" />
                                            </a>
                                        )}
                                    </div>
                                    {(item.phone || item.email || item.description) && (
                                        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                                            {item.phone && <p className="font-semibold tabular-nums text-ink">{item.phone}</p>}
                                            {item.email && <p className="break-all text-ink-secondary">{item.email}</p>}
                                            {item.description && <p className="text-ink-muted">{item.description}</p>}
                                        </div>
                                    )}
                                </Card>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
