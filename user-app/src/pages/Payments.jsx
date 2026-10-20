import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { apiRequest, API_BASE_URL } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ApartmentAccessGate from '../components/ApartmentAccessGate'
import { QrCode, Check, Zap, Droplet, Settings, ChevronDown, Receipt } from 'lucide-react'

const API_BASE = API_BASE_URL
const fmtMnt = (n) => Number(n).toLocaleString('mn-MN') + '₮'

/* ══════════════════════════════════════════════
   QPay mock modal (shared by both utility types)
══════════════════════════════════════════════ */
function QPayModal({ amount, onClose, onPaid }) {
    const [step, setStep] = useState('qr')

    const handlePay = () => {
        setStep('processing')
        setTimeout(() => setStep('done'), 2000)
        setTimeout(() => { onPaid(); onClose() }, 3200)
    }

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', padding: '24px 24px 36px', width: '100%', maxWidth: '420px', animation: 'pay-up 0.28s cubic-bezier(0.34,1.2,0.64,1)' }}
            >
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#e5e7eb', margin: '0 auto 20px' }} />

                {step === 'qr' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QrCode size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>QPay</p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Гар утасны төлбөр</p>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: '3px', width: '160px', margin: '0 auto 10px' }}>
                                {Array.from({ length: 100 }, (_, i) => (
                                    <div key={i} style={{ aspectRatio: '1', borderRadius: '1px', backgroundColor: Math.sin(i * 13.7 + 5.3) > 0.1 ? '#0f172a' : 'transparent' }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>QR код уншуулна уу</p>
                        </div>

                        <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#1e40af' }}>Нийт дүн</span>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af' }}>{fmtMnt(amount)}</span>
                        </div>
                        <button onClick={handlePay} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                            Төлбөр баталгаажуулах
                        </button>
                    </>
                )}

                {step === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', animation: 'pay-spin 0.7s linear infinite', margin: '0 auto' }} />
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '20px', marginBottom: '4px' }}>Боловсруулж байна...</p>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Банктай холбогдож байна</p>
                    </div>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Check size={32} color="#16a34a" strokeWidth={2.5} />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#15803d', margin: '0 0 4px' }}>Амжилттай!</p>
                        <p style={{ fontSize: '14px', color: '#16a34a', margin: 0 }}>Төлбөр баталгаажлаа</p>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════
   Utility setup bottom-sheet modal
══════════════════════════════════════════════ */
function UtilitySetupModal({ codes, onSave, onClose, colors }) {
    const [elec, setElec] = useState(codes.electricity || '')
    const [heat, setHeat] = useState(codes.heat || '')

    const inp = {
        width: '100%', padding: '11px 14px', borderRadius: '11px',
        border: `1.5px solid ${colors.border}`, fontSize: '14px',
        backgroundColor: colors.surfaceAlt, color: colors.text,
        boxSizing: 'border-box', letterSpacing: '0.5px',
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', animation: 'pay-up 0.25s cubic-bezier(0.34,1.3,0.64,1)' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: colors.border, margin: '0 auto 20px' }} />

                <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>Тооцооны код холбох</h3>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 20px' }}>
                    Кодоо нэг удаа оруулсны дараа төлбөрийн мэдээлэл автоматаар харагдана.
                </p>

                {/* Electricity */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={14} color="white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, margin: 0 }}>Цахилгаан — my.tog.mn</p>
                            <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>УБЦТС хэрэглэгчийн код</p>
                        </div>
                    </div>
                    <input style={inp} type="text" placeholder="Жишээ: UB12345678" value={elec} maxLength={16}
                        onChange={e => setElec(e.target.value.toUpperCase())} />
                </div>

                {/* Heat */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Droplet size={14} color="white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, margin: 0 }}>Дулаан & Ус — my.dulaan.mn</p>
                            <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>УБ Дулааны Сүлжээ хэрэглэгчийн код</p>
                        </div>
                    </div>
                    <input style={inp} type="text" placeholder="Жишээ: DU98765432" value={heat} maxLength={16}
                        onChange={e => setHeat(e.target.value.toUpperCase())} />
                </div>

                <button
                    onClick={() => onSave({ electricity: elec.trim(), heat: heat.trim() })}
                    style={{ width: '100%', padding: '13px', borderRadius: '13px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                    Хадгалах
                </button>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════
   Individual utility bill card (self-fetching)
══════════════════════════════════════════════ */
function UtilityBillCard({ type, code, onLinkClick, colors }) {
    const [bill,    setBill]    = useState(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)
    const [paid,    setPaid]    = useState(false)
    const [qpay,    setQpay]    = useState(false)
    const [expanded, setExpanded] = useState(false)

    const isElec = type === 'electricity'
    const cfg = isElec
        ? { label: 'Цахилгаан', sub: 'my.tog.mn', endpoint: 'electricity', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', icon: <Zap size={16} color="white" strokeWidth={2.5} /> }
        : { label: 'Дулаан & Ус', sub: 'my.dulaan.mn', endpoint: 'heat', grad: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: <Droplet size={16} color="white" strokeWidth={2.5} /> }

    const fetchBill = useCallback(async () => {
        if (!code) return
        setLoading(true); setError(null); setBill(null); setPaid(false)
        try {
            const res = await fetch(`${API_BASE}/api/utility/${cfg.endpoint}/${encodeURIComponent(code)}`)
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

    // ── Not linked ──
    if (!code) {
        return (
            <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0 0 2px' }}>{cfg.label}</p>
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{cfg.sub} — холбогдоогүй</p>
                </div>
                <button
                    onClick={onLinkClick}
                    style={{ padding: '7px 14px', borderRadius: '10px', border: `1.5px solid ${colors.accent}`, backgroundColor: colors.accentBg, color: colors.accent, fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                >
                    Холбох
                </button>
            </div>
        )
    }

    // ── Loading ──
    if (loading) {
        return (
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: colors.surface }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0 0 6px' }}>{cfg.label}</p>
                    <div style={{ height: '10px', borderRadius: '5px', backgroundColor: colors.border, width: '60%', animation: 'pay-pulse 1.4s ease-in-out infinite' }} />
                </div>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2.5px solid ${colors.border}`, borderTopColor: '#3b82f6', animation: 'pay-spin 0.7s linear infinite', flexShrink: 0 }} />
            </div>
        )
    }

    // ── Error ──
    if (error) {
        return (
            <div style={{ border: '1px solid #fecaca', borderRadius: '16px', padding: '16px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#b91c1c', margin: '0 0 2px' }}>{cfg.label}</p>
                    <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{error}</p>
                </div>
                <button onClick={fetchBill} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: 'white', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                    Дахин
                </button>
            </div>
        )
    }

    if (!bill) return null

    // ── Bill card ──
    const usageLine = isElec
        ? `${bill.usage_kWh} кВт·ц  ×  ${bill.pricePerUnit}₮`
        : `Дулаан ${bill.heatUsage_gcal} Гкал  +  Ус ${bill.waterUsage_m3} м³`

    return (
        <>
            {qpay && <QPayModal amount={bill.totalAmount} onClose={() => setQpay(false)} onPaid={() => setPaid(true)} />}

            <div style={{ border: `2px solid ${status === 'paid' ? '#86efac' : colors.border}`, borderRadius: '16px', overflow: 'hidden', backgroundColor: colors.surface, transition: 'border-color 0.3s' }}>
                {/* Card header strip */}
                <div style={{ background: cfg.grad, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>{cfg.label}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>Код: {bill.consumerCode}</p>
                    </div>
                    {/* Status pill */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: status === 'paid' ? '#dcfce7' : 'rgba(255,255,255,0.2)', color: status === 'paid' ? '#15803d' : 'white', border: status === 'paid' ? '1px solid #86efac' : '1px solid rgba(255,255,255,0.3)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: status === 'paid' ? '#22c55e' : '#fde68a' }} />
                        {status === 'paid' ? 'Төлсөн' : 'Төлөөгүй'}
                    </span>
                </div>

                {/* Amount row */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}` }}>
                    <div>
                        <p style={{ fontSize: '22px', fontWeight: '800', color: colors.text, margin: '0 0 2px' }}>{fmtMnt(bill.totalAmount)}</p>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{usageLine}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '0 0 2px' }}>Төлөх хугацаа</p>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, margin: 0 }}>{bill.dueDate}</p>
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(v => !v)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expanded ? `1px solid ${colors.border}` : 'none' }}
                >
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '500' }}>{expanded ? 'Хураангуй' : 'Дэлгэрэнгүй харах'}</span>
                    <ChevronDown size={14} color={colors.textMuted} strokeWidth={2.5} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Expandable detail rows */}
                {expanded && (
                    <div style={{ padding: '4px 16px 8px' }}>
                        {isElec ? (
                            <>
                                <DetailRow label="Өмнөх заалт"    value={`${bill.previousReading.toLocaleString()} кВт`} colors={colors} />
                                <DetailRow label="Одоогийн заалт"  value={`${bill.currentReading.toLocaleString()} кВт`} colors={colors} />
                                <DetailRow label="Хэрэглэсэн"      value={`${bill.usage_kWh} кВт·ц`} colors={colors} />
                                <DetailRow label="Нэгжийн үнэ"     value={`${bill.pricePerUnit}₮/кВт·ц`} colors={colors} />
                                <DetailRow label="Нийлүүлэгч"      value={bill.provider} colors={colors} />
                                <DetailRow label="Хаяг"            value={bill.address} colors={colors} />
                            </>
                        ) : (
                            <>
                                <DetailRow label="Дулаан хэрэглэсэн" value={`${bill.heatUsage_gcal} Гкал`} colors={colors} />
                                <DetailRow label="Дулааны үнэ"       value={`${fmtMnt(bill.heatPricePerGcal)}/Гкал`} colors={colors} />
                                <DetailRow label="Дулааны дүн"       value={fmtMnt(bill.heatAmount)} colors={colors} />
                                <DetailRow label="Ус хэрэглэсэн"     value={`${bill.waterUsage_m3} м³`} colors={colors} />
                                <DetailRow label="Усны үнэ"          value={`${fmtMnt(bill.waterPricePerM3)}/м³`} colors={colors} />
                                <DetailRow label="Усны дүн"          value={fmtMnt(bill.waterAmount)} colors={colors} />
                                <DetailRow label="Нийлүүлэгч"        value={bill.provider} colors={colors} />
                                <DetailRow label="Хаяг"              value={bill.address} colors={colors} />
                            </>
                        )}
                    </div>
                )}

                {/* Action */}
                <div style={{ padding: '12px 16px 14px' }}>
                    {status === 'paid' ? (
                        <div style={{ padding: '11px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Check size={16} color="#16a34a" strokeWidth={2.5} />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803d' }}>Төлбөр амжилттай төлөгдлөө</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => setQpay(true)}
                            style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <QrCode size={16} color="white" />
                            QPay-аар төлөх
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}

function DetailRow({ label, value, colors }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: '12px', color: colors.textMuted, flexShrink: 0, marginRight: '12px' }}>{label}</span>
            <span style={{ fontSize: '12px', fontWeight: '500', color: colors.text, textAlign: 'right' }}>{value}</span>
        </div>
    )
}

/* ══════════════════════════════════════════════
   Main Payments Page
══════════════════════════════════════════════ */
export default function Payments() {
    const headerRef  = useRef(null)
    const contentRef = useRef(null)
    const { colors } = useTheme()
    const { user, hasApartmentAccess } = useAuth()

    const [activeTab,       setActiveTab]       = useState('current')
    const [pendingPayments, setPendingPayments] = useState([])
    const [paymentHistory,  setPaymentHistory]  = useState([])
    const [loading,         setLoading]         = useState(true)
    const [requesting,      setRequesting]      = useState(null)

    // Utility codes stored in localStorage per user
    const storageKey = user?._id ? `utility_codes_${user._id}` : null
    const [utilityCodes, setUtilityCodes] = useState({ electricity: '', heat: '' })
    const [showSetup,    setShowSetup]    = useState(false)

    // Load saved codes on mount
    useEffect(() => {
        if (!storageKey) return
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) setUtilityCodes(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [storageKey])

    const saveUtilityCodes = (codes) => {
        setUtilityCodes(codes)
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(codes))
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
                alert('Төлбөр хүсэлт илгээгдлээ.')
            }
            // Reflect the new "processing" status
            loadPayments()
        } catch (err) {
            alert(err.message || 'Алдаа гарлаа.')
        } finally {
            setRequesting(null)
        }
    }

    const formatDate = (str) => {
        if (!str) return ''
        const d = new Date(str)
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
    }

    const getStatusLabel = (status) => {
        if (status === 'completed') return 'Төлсөн'
        if (status === 'pending')   return 'Төлөөгүй'
        if (status === 'processing') return 'Боловсруулж байна'
        if (status === 'failed')    return 'Амжилтгүй'
        return status
    }

    const isOverdue = (payment) => {
        if (payment.status !== 'pending' || !payment.month) return false
        const [year, month] = payment.month.split('-').map(Number)
        return new Date() > new Date(year, month - 1, 15)
    }

    useEffect(() => { loadPayments() }, [])

    useEffect(() => {
        const a = gsap.from(headerRef.current,  { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' })
        const b = gsap.from(contentRef.current, { y: 20,  opacity: 0, duration: 0.5, delay: 0.2, ease: 'power1.out' })
        return () => { a.kill(); b.kill() }
    }, [])

    const hasAnyUtility = utilityCodes.electricity || utilityCodes.heat

    const s = {
        container:   { padding: '16px', paddingBottom: '80px' },
        sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
        sectionLabel:{ fontSize: '13px', fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' },
        card: {
            backgroundColor: colors.surface, borderRadius: '14px', padding: '16px',
            marginBottom: '12px', boxShadow: `0 1px 4px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        tab:         { padding: '11px 16px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', flex: 1, textAlign: 'center' },
        activeTab:   { color: colors.accent, borderBottom: `2px solid ${colors.accent}` },
        inactiveTab: { color: colors.textMuted },
    }

    if (!hasApartmentAccess) {
        return <ApartmentAccessGate />
    }

    return (
        <div style={s.container}>
            {showSetup && (
                <UtilitySetupModal
                    codes={utilityCodes}
                    colors={colors}
                    onSave={saveUtilityCodes}
                    onClose={() => setShowSetup(false)}
                />
            )}

            <header ref={headerRef} style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, margin: 0 }}>Төлбөрүүд</h1>
                <p style={{ color: colors.textMuted, marginTop: '4px', marginBottom: 0 }}>Сарын төлбөрийн мэдээлэл</p>
            </header>

            <div ref={contentRef}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>
                    {[['current', 'Төлбөрүүд'], ['history', 'Төлбөрийн түүх']].map(([id, label]) => (
                        <div key={id} style={{ ...s.tab, ...(activeTab === id ? s.activeTab : s.inactiveTab) }} onClick={() => setActiveTab(id)}>
                            {label}
                        </div>
                    ))}
                </div>

                {activeTab === 'current' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* ── Section 1: HOA payments ── */}
                        <section>
                            <div style={s.sectionHead}>
                                <span style={s.sectionLabel}>🏢 СӨХ-ийн хураамж</span>
                            </div>

                            {loading ? (
                                <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '10px', color: colors.textMuted, fontSize: '14px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'pay-spin 0.7s linear infinite', flexShrink: 0 }} />
                                    Ачаалж байна...
                                </div>
                            ) : pendingPayments.length === 0 ? (
                                <div style={{ ...s.card, textAlign: 'center', color: colors.textMuted, padding: '28px' }}>
                                    <p style={{ fontSize: '28px', margin: '0 0 8px' }}>✅</p>
                                    <p style={{ fontSize: '14px', fontWeight: '500', color: colors.text, margin: '0 0 2px' }}>Одоогоор төлбөргүй байна</p>
                                    <p style={{ fontSize: '13px', margin: 0 }}>Сайн байна! Бүх төлбөр төлөгдсөн.</p>
                                </div>
                            ) : pendingPayments.map(payment => (
                                <div key={payment._id} style={s.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Receipt size={20} color="#2563eb" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, margin: 0 }}>{payment.description}</p>
                                                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{payment.month ? `${payment.month} сар` : ''}</p>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '18px', fontWeight: '800', color: colors.text, margin: 0 }}>{payment.amount.toLocaleString()}₮</p>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: '500', backgroundColor: isOverdue(payment) ? '#fee2e2' : '#fef3c7', color: isOverdue(payment) ? '#b91c1c' : '#92400e' }}>
                                            {isOverdue(payment) ? 'Хугацаа хэтэрсэн' : getStatusLabel(payment.status)}
                                        </span>
                                        <button
                                            style={{ padding: '9px 20px', backgroundColor: colors.brand, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: requesting === payment._id ? 'wait' : 'pointer', opacity: requesting === payment._id ? 0.6 : 1 }}
                                            disabled={requesting === payment._id}
                                            onClick={() => handleRequestPayment(payment)}
                                        >
                                            {requesting === payment._id ? 'Боловсруулж...' : 'Төлөх'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* ── Section 2: Utility bills ── */}
                        <section>
                            <div style={s.sectionHead}>
                                <span style={s.sectionLabel}>🏠 Орон сууцны төлбөрүүд</span>
                                <button
                                    onClick={() => setShowSetup(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceAlt, color: colors.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    <Settings size={13} />
                                    {hasAnyUtility ? 'Тохируулах' : 'Холбох'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <UtilityBillCard
                                    type="electricity"
                                    code={utilityCodes.electricity}
                                    onLinkClick={() => setShowSetup(true)}
                                    colors={colors}
                                />
                                <UtilityBillCard
                                    type="heat"
                                    code={utilityCodes.heat}
                                    onLinkClick={() => setShowSetup(true)}
                                    colors={colors}
                                />
                            </div>

                            {!hasAnyUtility && (
                                <p style={{ fontSize: '12px', color: colors.textMuted, textAlign: 'center', marginTop: '8px' }}>
                                    💡 «Холбох» товч дарж my.tog.mn болон my.dulaan.mn-ийн кодоо оруулна уу
                                </p>
                            )}
                        </section>
                    </div>
                ) : (
                    /* ── History tab ── */
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: colors.text }}>Төлбөрийн түүх</h2>
                        {loading ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Ачаалж байна...</p>
                        ) : paymentHistory.length === 0 ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Төлбөрийн түүх байхгүй.</p>
                        ) : paymentHistory.map(payment => (
                            <div key={payment._id} style={{ padding: '14px', backgroundColor: colors.surfaceAlt, borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text, margin: '0 0 2px' }}>{payment.description}</p>
                                    <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{payment.paidAt ? formatDate(payment.paidAt) : payment.month || ''}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{payment.amount.toLocaleString()}₮</span>
                                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: '600' }}>Төлсөн</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pay-spin  { to { transform: rotate(360deg); } }
                @keyframes pay-pulse { 0%,100%{opacity:.35} 50%{opacity:.9} }
                @keyframes pay-up    { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
            `}</style>
        </div>
    )
}
