import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { apiRequest, API_BASE_URL } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ApartmentAccessGate from '../components/ApartmentAccessGate'
import { useToast } from '../components/Toast'
import PageHeader from '../components/ui/PageHeader'
import SegmentedTabs from '../components/ui/SegmentedTabs'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import EmptyState from '../components/ui/EmptyState'
import Dialog from '../components/ui/Dialog'
import Field, { inputCls } from '../components/ui/Field'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { money, number, dayLabel, monthLabel, fullDate } from '../utils/format'
import { QrCode, Check, Zap, Droplet, Settings, ChevronDown, Receipt, CheckCircle2, History, RotateCcw } from 'lucide-react'

const UTILITY = {
    electricity: { label: 'Цахилгаан', sub: 'my.tog.mn', endpoint: 'electricity', icon: Zap, tint: 'bg-warning-bg text-warning-text' },
    heat: { label: 'Дулаан & Ус', sub: 'my.dulaan.mn', endpoint: 'heat', icon: Droplet, tint: 'bg-info-bg text-info-text' },
}

/* ── QPay (simulated) ───────────────────────────────────────── */
function QPayDialog({ open, amount, onClose, onPaid }) {
    const [step, setStep] = useState('qr')

    useEffect(() => { if (open) setStep('qr') }, [open])

    const handlePay = () => {
        setStep('processing')
        setTimeout(() => setStep('done'), 2000)
        setTimeout(() => { onPaid(); onClose() }, 3200)
    }

    return (
        <Dialog open={open} onClose={step === 'qr' ? onClose : undefined} title={step === 'qr' ? 'QPay-аар төлөх' : undefined}>
            {step === 'qr' && (
                <div className="space-y-4">
                    <div className="rounded-card border border-line bg-canvas p-5 text-center">
                        {/* Placeholder QR: the QPay integration is simulated */}
                        <div aria-hidden="true" className="mx-auto mb-3 grid w-40 grid-cols-10 gap-[3px]">
                            {Array.from({ length: 100 }, (_, i) => (
                                <div key={i} className={`aspect-square rounded-[1px] ${Math.sin(i * 13.7 + 5.3) > 0.1 ? 'bg-ink' : ''}`} />
                            ))}
                        </div>
                        <p className="text-xs text-ink-muted">Банкны аппаараа QR кодыг уншуулна уу</p>
                    </div>
                    <div className="flex items-center justify-between rounded-control bg-brand-soft px-4 py-3">
                        <span className="text-sm text-brand-text">Нийт дүн</span>
                        <span className="text-xl font-semibold text-brand-text">{money(amount)}</span>
                    </div>
                    <Button fullWidth onClick={handlePay}><QrCode size={18} aria-hidden="true" /> Төлбөр баталгаажуулах</Button>
                </div>
            )}
            {step === 'processing' && (
                <div role="status" className="py-8 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-line border-t-brand-text motion-reduce:animate-none" />
                    <p className="mt-5 text-base font-semibold text-ink">Боловсруулж байна…</p>
                    <p className="mt-1 text-sm text-ink-muted">Банктай холбогдож байна</p>
                </div>
            )}
            {step === 'done' && (
                <div role="status" className="py-6 text-center">
                    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-text">
                        <Check size={32} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <p className="text-lg font-semibold text-ink">Амжилттай!</p>
                    <p className="mt-1 text-sm text-ink-muted">Төлбөр баталгаажлаа</p>
                </div>
            )}
        </Dialog>
    )
}

/* ── Link utility account codes ─────────────────────────────── */
function UtilitySetupDialog({ open, codes, onSave, onClose }) {
    const [elec, setElec] = useState(codes.electricity || '')
    const [heat, setHeat] = useState(codes.heat || '')

    useEffect(() => { if (open) { setElec(codes.electricity || ''); setHeat(codes.heat || '') } }, [open, codes])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Тооцооны код холбох"
            description="Кодоо нэг удаа оруулсны дараа төлбөрийн мэдээлэл автоматаар харагдана."
        >
            <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); onSave({ electricity: elec.trim(), heat: heat.trim() }) }}
            >
                <Field label="Цахилгаан — my.tog.mn" hint="УБЦТС-ийн хэрэглэгчийн код">
                    <input className={`${inputCls} uppercase tracking-wide`} type="text" autoComplete="off" spellCheck={false}
                        placeholder="Жишээ: UB12345678…" value={elec} maxLength={16}
                        onChange={e => setElec(e.target.value.toUpperCase())} />
                </Field>
                <Field label="Дулаан & Ус — my.dulaan.mn" hint="УБ Дулааны Сүлжээний хэрэглэгчийн код">
                    <input className={`${inputCls} uppercase tracking-wide`} type="text" autoComplete="off" spellCheck={false}
                        placeholder="Жишээ: DU98765432…" value={heat} maxLength={16}
                        onChange={e => setHeat(e.target.value.toUpperCase())} />
                </Field>
                <Button type="submit" fullWidth>Хадгалах</Button>
            </form>
        </Dialog>
    )
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-b-0">
            <dt className="shrink-0 text-xs text-ink-muted">{label}</dt>
            <dd className="text-right text-xs font-medium text-ink">{value}</dd>
        </div>
    )
}

/* ── Utility bill card (fetches its own bill) ───────────────── */
function UtilityBillCard({ type, code, onLinkClick }) {
    const [bill, setBill] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [paid, setPaid] = useState(false)
    const [qpay, setQpay] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const cfg = UTILITY[type]
    const isElec = type === 'electricity'
    const Icon = cfg.icon
    const iconChip = (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${cfg.tint}`}>
            <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
    )

    const fetchBill = useCallback(async () => {
        if (!code) return
        setLoading(true); setError(null); setBill(null); setPaid(false)
        try {
            const res = await fetch(`${API_BASE_URL}/api/utility/${cfg.endpoint}/${encodeURIComponent(code)}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Алдаа гарлаа')
            setBill(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [code, cfg.endpoint])

    useEffect(() => { fetchBill() }, [fetchBill])

    const status = paid ? 'paid' : bill?.status

    if (!code) {
        return (
            <div className="flex items-center gap-3 rounded-card border-2 border-dashed border-line p-4">
                {iconChip}
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">{cfg.label}</p>
                    <p className="text-xs text-ink-muted">{cfg.sub} — холбогдоогүй</p>
                </div>
                <Button variant="soft" size="sm" onClick={onLinkClick}>Холбох</Button>
            </div>
        )
    }

    if (loading) {
        return (
            <Card className="flex items-center gap-3">
                {iconChip}
                <div className="flex-1 space-y-2" role="status" aria-label={`${cfg.label} ачаалж байна`}>
                    <p className="text-[15px] font-semibold text-ink">{cfg.label}</p>
                    <SkeletonBlock className="h-3 w-3/5" />
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <div role="alert" className="flex items-center gap-3 rounded-card bg-danger-bg p-4">
                {iconChip}
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-danger-text">{cfg.label}</p>
                    <p className="truncate text-xs text-danger-text">{error}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchBill}><RotateCcw size={14} aria-hidden="true" /> Дахин</Button>
            </div>
        )
    }

    if (!bill) return null

    const usageLine = isElec
        ? `${bill.usage_kWh} кВт·ц × ${bill.pricePerUnit}₮`
        : `Дулаан ${bill.heatUsage_gcal} Гкал + Ус ${bill.waterUsage_m3} м³`

    return (
        <>
            <QPayDialog open={qpay} amount={bill.totalAmount} onClose={() => setQpay(false)} onPaid={() => setPaid(true)} />

            <Card padded={false} className={status === 'paid' ? 'border-success-text/40' : ''}>
                <div className="flex items-center gap-3 p-4">
                    {iconChip}
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-ink">{cfg.label}</p>
                        <p className="truncate text-xs text-ink-muted">Код: {bill.consumerCode}</p>
                    </div>
                    <StatusPill tone={status === 'paid' ? 'success' : 'warning'}>{status === 'paid' ? 'Төлсөн' : 'Төлөөгүй'}</StatusPill>
                </div>

                <div className="px-4 pb-3">
                    <p className="text-2xl font-semibold tracking-tight text-ink">{money(bill.totalAmount)}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{usageLine}</p>
                    <p className="mt-3 flex items-baseline justify-between gap-3 rounded-control bg-surface-muted px-3 py-2 text-xs">
                        <span className="shrink-0 text-ink-muted">Төлөх хугацаа</span>
                        <span className="text-right font-semibold text-ink">{bill.dueDate}</span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:bg-surface-muted"
                >
                    {expanded ? 'Хураангуй' : 'Дэлгэрэнгүй харах'}
                    <ChevronDown size={15} aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                    <dl className="border-t border-line px-4 py-1">
                        {isElec ? (
                            <>
                                <DetailRow label="Өмнөх заалт" value={`${number(bill.previousReading)} кВт`} />
                                <DetailRow label="Одоогийн заалт" value={`${number(bill.currentReading)} кВт`} />
                                <DetailRow label="Хэрэглэсэн" value={`${bill.usage_kWh} кВт·ц`} />
                                <DetailRow label="Нэгжийн үнэ" value={`${bill.pricePerUnit}₮/кВт·ц`} />
                                <DetailRow label="Нийлүүлэгч" value={bill.provider} />
                                <DetailRow label="Хаяг" value={bill.address} />
                            </>
                        ) : (
                            <>
                                <DetailRow label="Дулаан хэрэглэсэн" value={`${bill.heatUsage_gcal} Гкал`} />
                                <DetailRow label="Дулааны үнэ" value={`${money(bill.heatPricePerGcal)}/Гкал`} />
                                <DetailRow label="Дулааны дүн" value={money(bill.heatAmount)} />
                                <DetailRow label="Ус хэрэглэсэн" value={`${bill.waterUsage_m3} м³`} />
                                <DetailRow label="Усны үнэ" value={`${money(bill.waterPricePerM3)}/м³`} />
                                <DetailRow label="Усны дүн" value={money(bill.waterAmount)} />
                                <DetailRow label="Нийлүүлэгч" value={bill.provider} />
                                <DetailRow label="Хаяг" value={bill.address} />
                            </>
                        )}
                    </dl>
                )}

                <div className="border-t border-line p-4">
                    {status === 'paid' ? (
                        <p className="flex items-center justify-center gap-2 rounded-control bg-success-bg py-3 text-sm font-semibold text-success-text">
                            <Check size={16} strokeWidth={2.5} aria-hidden="true" /> Төлбөр амжилттай төлөгдлөө
                        </p>
                    ) : (
                        <Button fullWidth onClick={() => setQpay(true)}><QrCode size={18} aria-hidden="true" /> QPay-аар төлөх</Button>
                    )}
                </div>
            </Card>
        </>
    )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function Payments() {
    const { user, hasApartmentAccess } = useAuth()
    const toast = useToast()

    // A link can open the history tab directly (e.g. Home → «Төлбөрийн түүх»)
    const location = useLocation()
    const [activeTab, setActiveTab] = useState(location.state?.tab === 'history' ? 'history' : 'current')
    const [pendingPayments, setPendingPayments] = useState([])
    const [paymentHistory, setPaymentHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [requesting, setRequesting] = useState(null)

    // Utility codes stored in localStorage per user
    const storageKey = user?._id ? `utility_codes_${user._id}` : null
    const [utilityCodes, setUtilityCodes] = useState({ electricity: '', heat: '' })
    const [showSetup, setShowSetup] = useState(false)

    useEffect(() => {
        if (!storageKey) return
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) setUtilityCodes(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [storageKey])

    const saveUtilityCodes = (codes) => {
        setUtilityCodes(codes)
        try { if (storageKey) localStorage.setItem(storageKey, JSON.stringify(codes)) } catch { /* ignore */ }
        setShowSetup(false)
    }

    const loadPayments = async () => {
        try {
            const [allPayments, history] = await Promise.allSettled([
                apiRequest('/api/payments/my-payments'),
                apiRequest('/api/payments/history'),
            ])
            if (allPayments.status === 'fulfilled') {
                const list = Array.isArray(allPayments.value) ? allPayments.value : []
                setPendingPayments(list.filter(p => p.status === 'pending' || p.status === 'processing'))
            }
            if (history.status === 'fulfilled') {
                const data = history.value
                const list = Array.isArray(data) ? data : data?.payments || []
                setPaymentHistory(list)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRequestPayment = async (payment) => {
        setRequesting(payment._id)
        try {
            const result = await apiRequest(`/api/payments/${payment._id}/pay`, {
                method: 'POST',
            })
            if (result.payment?.deeplink) {
                window.open(result.payment.deeplink, '_blank')
            } else {
                toast.show('Төлбөр хүсэлт илгээгдлээ.')
            }
            // Reflect the new "processing" status
            loadPayments()
        } catch (err) {
            toast.show(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.')
        } finally {
            setRequesting(null)
        }
    }

    const isOverdue = (payment) => {
        if (payment.status !== 'pending' || !payment.month) return false
        const [year, month] = payment.month.split('-').map(Number)
        return new Date() > new Date(year, month - 1, 15)
    }

    const statusOf = (payment) => {
        if (isOverdue(payment)) return { tone: 'danger', label: 'Хугацаа хэтэрсэн' }
        if (payment.status === 'processing') return { tone: 'info', label: 'Боловсруулж байна' }
        if (payment.status === 'failed') return { tone: 'danger', label: 'Амжилтгүй' }
        return { tone: 'warning', label: 'Төлөөгүй' }
    }

    useEffect(() => { loadPayments() }, [])

    const hasAnyUtility = utilityCodes.electricity || utilityCodes.heat
    const totalDue = pendingPayments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)

    if (!hasApartmentAccess) {
        return <ApartmentAccessGate />
    }

    return (
        <div className="pb-4 pt-2">
            <UtilitySetupDialog open={showSetup} codes={utilityCodes} onSave={saveUtilityCodes} onClose={() => setShowSetup(false)} />

            <PageHeader title="Төлбөр" description="СӨХ-ийн хураамж болон орон сууцны төлбөр" />

            <SegmentedTabs
                label="Төлбөрийн хэсэг"
                value={activeTab}
                onChange={setActiveTab}
                className="mb-6"
                tabs={[
                    { id: 'current', label: 'Төлөх', count: pendingPayments.length },
                    { id: 'history', label: 'Түүх' },
                ]}
            />

            {activeTab === 'current' ? (
                <div className="space-y-8">
                    {/* HOA fees */}
                    <section aria-labelledby="hoa-fees" className="space-y-3">
                        {!loading && totalDue > 0 && (
                            <div className="flex items-center justify-between rounded-card bg-brand px-5 py-4 text-on-brand">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">Төлөх нийт дүн</p>
                                    <p className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">{money(totalDue)}</p>
                                </div>
                                <Receipt size={28} className="text-white/50" aria-hidden="true" />
                            </div>
                        )}

                        <h2 id="hoa-fees" className="pt-1 text-[15px] font-semibold text-ink-muted">СӨХ-ийн хураамж</h2>

                        {loading ? (
                            <div className="space-y-3"><SkeletonBlock className="h-32 rounded-card" /></div>
                        ) : pendingPayments.length === 0 ? (
                            <Card>
                                <EmptyState icon={CheckCircle2} title="Одоогоор төлбөргүй байна" description="Бүх төлбөр төлөгдсөн байна." className="py-6" />
                            </Card>
                        ) : (
                            <ul className="space-y-3">
                                {pendingPayments.map(payment => {
                                    const st = statusOf(payment)
                                    return (
                                        <li key={payment._id}>
                                            <Card>
                                                <div className="flex items-start gap-3">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                                        <Receipt size={20} aria-hidden="true" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[15px] font-semibold text-ink">{payment.description}</p>
                                                        <p className="text-[13px] text-ink-muted">{payment.month ? monthLabel(payment.month) : ''}</p>
                                                    </div>
                                                    <p className="shrink-0 text-lg font-semibold text-ink">{money(payment.amount)}</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                                                    <Button
                                                        size="sm"
                                                        className="h-10 px-5"
                                                        loading={requesting === payment._id}
                                                        onClick={() => handleRequestPayment(payment)}
                                                    >
                                                        Төлөх
                                                    </Button>
                                                </div>
                                            </Card>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </section>

                    {/* Utility bills */}
                    <section aria-labelledby="utility-bills" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 id="utility-bills" className="text-[15px] font-semibold text-ink-muted">Орон сууцны төлбөр</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
                                <Settings size={15} aria-hidden="true" /> {hasAnyUtility ? 'Тохируулах' : 'Холбох'}
                            </Button>
                        </div>
                        <UtilityBillCard type="electricity" code={utilityCodes.electricity} onLinkClick={() => setShowSetup(true)} />
                        <UtilityBillCard type="heat" code={utilityCodes.heat} onLinkClick={() => setShowSetup(true)} />
                        {!hasAnyUtility && (
                            <p className="text-center text-xs text-ink-muted">
                                «Холбох» товч дарж my.tog.mn болон my.dulaan.mn-ийн кодоо оруулна уу.
                            </p>
                        )}
                    </section>
                </div>
            ) : (
                <section aria-label="Төлбөрийн түүх">
                    {loading ? (
                        <SkeletonBlock className="h-40 rounded-card" />
                    ) : paymentHistory.length === 0 ? (
                        <Card>
                            <EmptyState icon={History} title="Төлбөрийн түүх алга" description="Төлсөн төлбөр энд харагдана." className="py-6" />
                        </Card>
                    ) : (
                        <Card padded={false}>
                            <ul className="divide-y divide-line">
                                {paymentHistory.map(payment => (
                                    <li key={payment._id} className="flex items-center gap-3 px-4 py-3.5">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-text">
                                            <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-medium text-ink">{payment.description}</p>
                                            <p className="text-xs text-ink-muted">
                                                {payment.paidAt ? fullDate(payment.paidAt) : payment.month ? monthLabel(payment.month) : ''}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[15px] font-semibold text-ink">{money(payment.amount)}</p>
                                            <p className="text-[11px] font-medium text-success-text">Төлсөн{payment.paidAt ? ` · ${dayLabel(payment.paidAt)}` : ''}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </section>
            )}
        </div>
    )
}
