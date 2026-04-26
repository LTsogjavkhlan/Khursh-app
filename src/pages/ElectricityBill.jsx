import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../context/ThemeContext'

const API_BASE = 'http://localhost:5000'

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n).toLocaleString('mn-MN') + '₮'

/* ── small sub-components ────────────────────────────────── */

function InfoRow({ label, value, accent, bold }) {
    const { colors } = useTheme()
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: '13px', color: colors.textMuted, flexShrink: 0, marginRight: '12px' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: bold ? '700' : '500', color: accent || colors.text, textAlign: 'right' }}>{value}</span>
        </div>
    )
}

function StatusBadge({ status }) {
    const isPaid = status === 'paid'
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            backgroundColor: isPaid ? '#dcfce7' : '#fef3c7',
            color: isPaid ? '#15803d' : '#92400e',
            border: `1px solid ${isPaid ? '#86efac' : '#fde68a'}`,
        }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: isPaid ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
            {isPaid ? 'Төлөгдсөн' : 'Төлөгдөөгүй'}
        </span>
    )
}

function Spinner({ size = 20, color = '#3b82f6' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `2.5px solid ${color}30`,
            borderTopColor: color,
            animation: 'elec-spin 0.7s linear infinite',
            flexShrink: 0,
        }} />
    )
}

function UsageBar({ usage }) {
    // 400 kWh = 100%
    const pct = Math.min((usage / 400) * 100, 100)
    const color = usage < 150 ? '#22c55e' : usage < 280 ? '#f59e0b' : '#ef4444'
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Хэрэглээ</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color }}>{usage} кВт·ц</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: '4px', backgroundColor: color, transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>0</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>400 кВт·ц</span>
            </div>
        </div>
    )
}

/* ── QPay mock modal ─────────────────────────────────────── */

function QPayModal({ amount, onClose, onPaid }) {
    const [step, setStep] = useState('qr')   // 'qr' | 'processing' | 'done'

    const handlePay = () => {
        setStep('processing')
        setTimeout(() => setStep('done'), 2000)
        setTimeout(() => { onPaid(); onClose() }, 3200)
    }

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', padding: '24px 24px 36px', width: '100%', maxWidth: '420px', animation: 'elec-up 0.28s cubic-bezier(0.34,1.2,0.64,1)' }}
            >
                {/* Handle */}
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#e5e7eb', margin: '0 auto 20px' }} />

                {step === 'qr' && (
                    <>
                        {/* QPay branding */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <path d="M14 14h3v3M17 14h3M14 17v3" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>QPay</p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Гар утасны төлбөр</p>
                            </div>
                        </div>

                        {/* Fake QR code */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '18px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: '3px', width: '180px', margin: '0 auto 12px' }}>
                                {Array.from({ length: 100 }, (_, i) => (
                                    <div key={i} style={{
                                        aspectRatio: '1', borderRadius: '1px',
                                        backgroundColor: Math.sin(i * 13.7 + 5.3) > 0.1 ? '#0f172a' : 'transparent',
                                    }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>QR код уншуулна уу</p>
                        </div>

                        {/* Amount */}
                        <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <span style={{ fontSize: '14px', color: '#1e40af' }}>Нийт дүн</span>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af' }}>{fmt(amount)}</span>
                        </div>

                        <button
                            onClick={handlePay}
                            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Төлбөр баталгаажуулах
                        </button>
                    </>
                )}

                {step === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <Spinner size={48} color="#6366f1" />
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '20px', marginBottom: '4px' }}>Боловсруулж байна...</p>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Банктай холбогдож байна</p>
                    </div>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#15803d', margin: '0 0 6px' }}>Амжилттай!</p>
                        <p style={{ fontSize: '14px', color: '#16a34a', margin: 0 }}>Төлбөр баталгаажлаа</p>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ── Main Page ───────────────────────────────────────────── */

export default function ElectricityBill() {
    const { colors } = useTheme()
    const containerRef = useRef(null)

    const [code,       setCode]       = useState('')
    const [loading,    setLoading]    = useState(false)
    const [bill,       setBill]       = useState(null)
    const [error,      setError]      = useState(null)
    const [paidStatus, setPaidStatus] = useState(false)
    const [showQPay,   setShowQPay]   = useState(false)

    useEffect(() => {
        gsap.from(containerRef.current, { y: 16, opacity: 0, duration: 0.4, ease: 'power2.out' })
    }, [])

    const handleCheck = async (e) => {
        e?.preventDefault()
        const trimmed = code.trim()
        if (!trimmed) return

        setLoading(true)
        setError(null)
        setBill(null)
        setPaidStatus(false)

        try {
            const res = await fetch(`${API_BASE}/api/utility/electricity/${encodeURIComponent(trimmed)}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Алдаа гарлаа')
            setBill(data)
        } catch (err) {
            setError(err.message || 'Серверт холбогдоход алдаа гарлаа')
        } finally {
            setLoading(false)
        }
    }

    const currentStatus = paidStatus ? 'paid' : bill?.status

    const s = {
        page:   { padding: '16px 0 80px' },
        label:  { display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '6px' },
        input: {
            width: '100%', padding: '13px 16px', borderRadius: '14px', border: `1.5px solid ${colors.border}`,
            fontSize: '16px', backgroundColor: colors.surfaceAlt, color: colors.text,
            outline: 'none', boxSizing: 'border-box', letterSpacing: '1px',
        },
        card: {
            backgroundColor: colors.surface, borderRadius: '20px',
            border: `1px solid ${colors.border}`, boxShadow: `0 2px 8px ${colors.shadow}`,
            overflow: 'hidden', marginTop: '16px',
        },
    }

    return (
        <div ref={containerRef} style={s.page}>
            {showQPay && bill && (
                <QPayModal
                    amount={bill.totalAmount}
                    onClose={() => setShowQPay(false)}
                    onPaid={() => setPaidStatus(true)}
                />
            )}

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: colors.text, margin: 0 }}>Цахилгааны тооцоо</h1>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>Улаанбаатар Эрчим Хүч ХК</p>
                    </div>
                </div>
            </div>

            {/* Search card */}
            <div style={{ backgroundColor: colors.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${colors.border}`, boxShadow: `0 2px 8px ${colors.shadow}` }}>
                <label style={s.label}>Хэрэглэгчийн код</label>
                <form onSubmit={handleCheck} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        style={s.input}
                        type="text"
                        placeholder="Жишээ: UB12345678"
                        value={code}
                        maxLength={16}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        style={{
                            padding: '13px 20px', borderRadius: '14px', border: 'none', flexShrink: 0,
                            backgroundColor: loading || !code.trim() ? '#93c5fd' : '#2563eb',
                            color: 'white', fontWeight: '600', fontSize: '14px',
                            cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'background-color 0.15s',
                        }}
                    >
                        {loading ? <Spinner size={16} color="white" /> : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                        )}
                        {loading ? 'Хайж байна' : 'Шалгах'}
                    </button>
                </form>

                <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '10px', margin: '10px 0 0' }}>
                    💡 Хэрэглэгчийн кодыг цахилгааны дансны дэвтрээс эсвэл УБЭХ-ийн апп-аас олно уу
                </p>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div style={{ ...s.card, padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Spinner size={28} />
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, margin: '0 0 2px' }}>Мэдээлэл татаж байна...</p>
                            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>УБЭХ серверт холбогдож байна</p>
                        </div>
                    </div>
                    {[80, 60, 90, 50].map((w, i) => (
                        <div key={i} style={{ height: '14px', borderRadius: '7px', backgroundColor: colors.border, marginBottom: '12px', width: `${w}%`, animation: 'elec-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#b91c1c', margin: '0 0 2px' }}>Алдаа гарлаа</p>
                        <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
                    </div>
                </div>
            )}

            {/* Bill result */}
            {bill && !loading && (
                <div style={{ animation: 'elec-fade 0.35s ease' }}>
                    {/* Provider header strip */}
                    <div style={{ ...s.card, padding: 0 }}>
                        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1e40af)', padding: '20px 20px 16px', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Эрчим хүчний тооцоо</p>
                                    <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>{bill.customerName}</p>
                                    <p style={{ fontSize: '12px', opacity: 0.75, margin: 0 }}>Код: {bill.consumerCode}</p>
                                </div>
                                <StatusBadge status={currentStatus} />
                            </div>
                            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '11px', opacity: 0.65, margin: '0 0 2px' }}>Нийт төлөх дүн</p>
                                    <p style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{fmt(bill.totalAmount)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '11px', opacity: 0.65, margin: '0 0 2px' }}>Төлбөрийн хугацаа</p>
                                    <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{bill.dueDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Meter reading section */}
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Тоолуурын заалт — {bill.billPeriod}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                {[
                                    { label: 'Өмнөх заалт', value: bill.previousReading.toLocaleString() + ' кВт', color: colors.textMuted },
                                    { label: 'Одоогийн заалт', value: bill.currentReading.toLocaleString() + ' кВт', color: colors.text },
                                    { label: 'Хэрэглэсэн', value: bill.usage_kWh + ' кВт·ц', color: '#2563eb' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ backgroundColor: colors.surfaceAlt, borderRadius: '12px', padding: '10px 12px' }}>
                                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '0 0 4px' }}>{label}</p>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color, margin: 0 }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <UsageBar usage={bill.usage_kWh} />
                        </div>

                        {/* Details */}
                        <div style={{ padding: '4px 20px 4px' }}>
                            <InfoRow label="Хаяг"          value={bill.address} />
                            <InfoRow label="Нэгжийн үнэ"   value={`${bill.pricePerUnit}₮ / кВт·ц`} />
                            <InfoRow label="Хэрэглэсэн"     value={`${bill.usage_kWh} кВт·ц`} />
                            <InfoRow label="Нийт дүн"       value={fmt(bill.totalAmount)} bold accent="#1d4ed8" />
                            <InfoRow label="Нийлүүлэгч"     value={bill.provider} />
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentStatus === 'unpaid' ? (
                                <button
                                    onClick={() => setShowQPay(true)}
                                    style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                        <path d="M14 14h3v3M17 14h3M14 17v3" />
                                    </svg>
                                    QPay-аар төлөх
                                </button>
                            ) : (
                                <div style={{ width: '100%', padding: '14px', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#15803d' }}>Төлбөр амжилттай төлөгдлөө</span>
                                </div>
                            )}

                            <button
                                onClick={() => { setBill(null); setCode(''); setPaidStatus(false) }}
                                style={{ width: '100%', padding: '12px', border: `1.5px solid ${colors.border}`, borderRadius: '14px', backgroundColor: 'transparent', color: colors.textMuted, fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                            >
                                Дахин шалгах
                            </button>
                        </div>
                    </div>

                    {/* Tip box */}
                    <div style={{ marginTop: '14px', padding: '14px 16px', borderRadius: '14px', backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}`, display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, lineHeight: '1.6' }}>
                            Хэрэглэгчийн кодыг ашиглан тооцоогоо шалгаж, QPay болон бусад банкны апп-аар төлж болно. Хугацаа хэтэрвэл нэмэлт торгууль тооцогдоно.
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes elec-spin    { to { transform: rotate(360deg); } }
                @keyframes elec-pulse   { 0%,100%{opacity:.4} 50%{opacity:1} }
                @keyframes elec-fade    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes elec-up      { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
            `}</style>
        </div>
    )
}
