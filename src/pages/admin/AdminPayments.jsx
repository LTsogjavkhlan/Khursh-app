import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('mn-MN')
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtAddress(user) {
  if (!user) return '—'
  const parts = []
  if (user.building)        parts.push(`${user.building}-р байр`)
  if (user.entrance)        parts.push(`${user.entrance}-р орц`)
  if (user.floor)           parts.push(`${user.floor}-р давхар`)
  if (user.apartmentNumber) parts.push(`${user.apartmentNumber}-р тоот`)
  return parts.length ? parts.join(', ') : (user.email || '—')
}

function buildingLabel(user) { return user?.building || '?' }

const inputCls = 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors'
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5'

/* ─── AddressAvatar ─────────────────────────────────────────── */
function AddressAvatar({ user, size = 'md' }) {
  const colors = [
    'from-blue-400 to-blue-600', 'from-violet-400 to-violet-600',
    'from-rose-400 to-rose-600', 'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600', 'from-cyan-400 to-cyan-600',
  ]
  const color = colors[(user?.building?.charCodeAt(0) ?? user?.email?.charCodeAt(0) ?? 0) % colors.length]
  const sz = size === 'lg' ? 'w-14 h-14 text-base' : 'w-9 h-9 text-[11px]'
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${color} flex flex-col items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold leading-none">{buildingLabel(user)}</span>
      {user?.apartmentNumber && size !== 'lg' && (
        <span className="text-white/70 text-[9px] leading-none mt-0.5">{user.apartmentNumber}</span>
      )}
      {user?.apartmentNumber && size === 'lg' && (
        <span className="text-white/80 text-xs leading-none mt-1">{user.apartmentNumber}</span>
      )}
    </div>
  )
}

/* ─── PaymentDetailModal ────────────────────────────────────── */
function PaymentDetailModal({ payment, onClose, onMarkPaid, onDelete, actioningId }) {
  if (!payment) return null
  const addr = fmtAddress(payment.user)
  const isPending = payment.status === 'pending'
  const isActioning = actioningId === payment._id

  const METHOD_LABEL = { qpay: 'QPay', cash: 'Бэлэн мөнгө', manual: 'Гараар тэмдэглэсэн' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: 'zoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className={`h-16 relative ${isPending ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-5 text-white/80 text-xs font-semibold">
            {isPending ? 'Хүлээгдэж байна' : 'Төлсөн'}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + amount */}
          <div className="-mt-6 mb-5 flex items-end justify-between">
            <div className="border-2 border-white rounded-2xl shadow-lg">
              <AddressAvatar user={payment.user} size="lg" />
            </div>
            <div className="text-right mt-3">
              <p className="text-2xl font-bold text-slate-900">{fmt(payment.amount)}₮</p>
              <p className="text-xs text-slate-400">{payment.month || '—'}</p>
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Хаяг</p>
            <p className="text-base font-bold text-slate-900">{addr}</p>
          </div>

          <div className="border-t border-slate-100 mb-4" />

          {/* Details grid */}
          <div className="space-y-3">
            <Row icon={personIcon} label="Нэр" value={
              payment.user?.firstName || payment.user?.lastName
                ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim()
                : '—'
            } />
            <Row icon={calIcon} label="Сар" value={payment.month || '—'} />
            <Row icon={cardIcon} label="Төлбөрийн арга" value={METHOD_LABEL[payment.paymentMethod] || payment.paymentMethod || '—'} />
            {payment.paidAt && (
              <Row icon={checkIcon} label="Төлсөн огноо" value={fmtDate(payment.paidAt)} />
            )}
            <Row icon={dateIcon} label="Үүссэн огноо" value={fmtDate(payment.createdAt)} />
          </div>

          {/* Actions for pending */}
          {isPending && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Үйлдлүүд</p>
              <button
                disabled={isActioning}
                onClick={() => onMarkPaid(payment._id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors justify-center"
              >
                {isActioning ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Төлсөн гэж тэмдэглэх
              </button>
              <button
                disabled={isActioning}
                onClick={() => onDelete(payment._id, fmtAddress(payment.user))}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 bg-white disabled:opacity-50 transition-colors justify-center"
              >
                {isActioning ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6" />
                  </svg>
                )}
                Устгах
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes zoomIn {
          from { opacity:0; transform:scale(0.88); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  )
}

/* ─── icon helpers for modal rows ──────────────────────────── */
const personIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const calIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const cardIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)
const checkIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const dateIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

/* ─── PaymentCard ────────────────────────────────────────────── */
function PaymentCard({ payment, onClick }) {
  const addr = fmtAddress(payment.user)
  const isPending = payment.status === 'pending'
  return (
    <button
      onClick={() => onClick(payment)}
      className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
    >
      <AddressAvatar user={payment.user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{addr}</p>
        <p className="text-xs text-slate-400 mt-0.5">{payment.month || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900">{fmt(payment.amount)}₮</p>
        {!isPending && payment.paidAt && (
          <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(payment.paidAt)}</p>
        )}
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

/* ─── SingleUserBillModal ───────────────────────────────────── */
function SingleUserBillModal({ onClose, onCreated, defaultMonth, settings }) {
  const [users, setUsers]       = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [month, setMonth]       = useState(defaultMonth)
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    apiRequest('/api/admin/users')
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const addr = fmtAddress(u).toLowerCase()
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase()
    return !q || addr.includes(q) || name.includes(q)
  })

  async function handleCreate() {
    if (!selected || !month) return
    setCreating(true); setError(null)
    try {
      const data = await apiRequest('/api/payments/admin/generate-bill-for-user', {
        method: 'POST',
        body: JSON.stringify({ userId: selected._id, month }),
      })
      onCreated(data.payment)
    } catch (err) {
      setError(err.message || 'Алдаа гарлаа')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', animation: 'zoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Тодорхой айлд төлбөр үүсгэх</h2>
            <p className="text-xs text-slate-400 mt-0.5">Хэрэглэгч сонгоод сар зааж үүсгэнэ</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User picker */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 sticky top-0 bg-white z-10">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Хаяг эсвэл нэрээр хайх..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              Ачаалж байна...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Хэрэглэгч олдсонгүй</p>
          ) : (
            <div className="px-2 pb-2">
              {filtered.map(u => {
                const addr = fmtAddress(u)
                const isSelected = selected?._id === u._id
                return (
                  <button
                    key={u._id}
                    onClick={() => setSelected(isSelected ? null : u)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5 ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-300 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <AddressAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{addr}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {u.firstName} {u.lastName}
                        {u.hoaName ? ` • ${u.hoaName}` : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: month + create */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-3">
          {selected && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-200">
              <AddressAvatar user={selected} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900 truncate">{fmtAddress(selected)}</p>
                <p className="text-xs text-blue-500">{selected.firstName} {selected.lastName}</p>
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Сар</label>
            <input
              type="month" value={month} onChange={e => setMonth(e.target.value)}
              className={`${inputCls} w-full`}
            />
          </div>
          {settings && (
            <p className="text-xs text-slate-400">
              Дүн: <strong className="text-slate-700">{fmt(settings.monthlyFee)}₮</strong>
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={!selected || !month || creating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Үүсгэж байна...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Энэ хүнд төлбөр үүсгэх</>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes zoomIn {
          from { opacity:0; transform:scale(0.88); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────── */
export default function AdminPayments() {
  const [settings, setSettings]         = useState({ monthlyFee: 50000, dueDay: 15 })
  const [editFee, setEditFee]           = useState('')
  const [editDueDay, setEditDueDay]     = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved]   = useState(false)

  const [generateMonth, setGenerateMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating]         = useState(false)
  const [generateResult, setGenerateResult] = useState(null)

  const [payments, setPayments]           = useState([])
  const [stats, setStats]                 = useState(null)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [error, setError]                 = useState(null)
  const [actioningId, setActioningId]     = useState(null)

  const [tab, setTab]               = useState('pending') // 'pending' | 'paid'
  const [search, setSearch]         = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showSingleModal, setShowSingleModal] = useState(false)

  async function loadSettings() {
    try {
      const data = await apiRequest('/api/payments/settings')
      setSettings(data)
      setEditFee(String(data.monthlyFee))
      setEditDueDay(String(data.dueDay))
    } catch { /* keep defaults */ }
  }

  async function loadPayments() {
    try {
      setLoadingPayments(true)
      const data = await apiRequest('/api/payments/admin/all')
      setPayments(Array.isArray(data.payments) ? data.payments : [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => { loadSettings(); loadPayments() }, [])

  // Keep modal in sync when payment status changes
  useEffect(() => {
    if (selectedPayment) {
      const updated = payments.find(p => p._id === selectedPayment._id)
      if (updated) setSelectedPayment(updated)
    }
  }, [payments]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const data = await apiRequest('/api/payments/settings', {
        method: 'PUT',
        body: JSON.stringify({ monthlyFee: Number(editFee), dueDay: Number(editDueDay) }),
      })
      setSettings(data.settings)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function markAsPaid(id) {
    if (!window.confirm('Энэ төлбөрийг "Төлсөн" гэж тэмдэглэх үү?')) return
    try {
      setActioningId(id)
      await apiRequest(`/api/payments/admin/${id}/mark-paid`, { method: 'PUT' })
      const now = new Date().toISOString()
      setPayments(prev => prev.map(p => p._id === id ? { ...p, status: 'completed', paidAt: now } : p))
      setSelectedPayment(null)
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setActioningId(null)
    }
  }

  async function handleDelete(id, label) {
    if (!window.confirm(`"${label}"-ийн төлбөрийг устгах уу?`)) return
    try {
      setActioningId(id)
      await apiRequest(`/api/payments/admin/${id}`, { method: 'DELETE' })
      setPayments(prev => prev.filter(p => p._id !== id))
      setSelectedPayment(null)
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setActioningId(null)
    }
  }

  async function generateBills() {
    if (!generateMonth) return
    setGenerating(true); setGenerateResult(null)
    try {
      const data = await apiRequest('/api/payments/admin/generate-bills', {
        method: 'POST',
        body: JSON.stringify({ month: generateMonth }),
      })
      setGenerateResult(data)
      await loadPayments()
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setGenerating(false)
    }
  }

  const pendingList = payments.filter(p => p.status === 'pending')
  const paidList    = payments.filter(p => p.status === 'completed' || p.status === 'processing')

  function filterList(list) {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(p =>
      fmtAddress(p.user).toLowerCase().includes(q) ||
      (p.month || '').toLowerCase().includes(q) ||
      `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.toLowerCase().includes(q)
    )
  }

  const visibleList = filterList(tab === 'pending' ? pendingList : paidList)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Detail modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onMarkPaid={markAsPaid}
          onDelete={handleDelete}
          actioningId={actioningId}
        />
      )}

      {showSingleModal && (
        <SingleUserBillModal
          defaultMonth={generateMonth}
          settings={settings}
          onClose={() => setShowSingleModal(false)}
          onCreated={newPayment => {
            if (newPayment) setPayments(prev => [newPayment, ...prev])
            setShowSingleModal(false)
            loadPayments()
          }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Төлбөр удирдах</h1>
        <p className="text-sm text-slate-500 mt-1">Сарын хураамж тохиргоо болон оршин суугчдын төлбөрүүд</p>
      </div>

      {/* Settings + Generate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Сарын хураамжийн тохиргоо</h2>
              <p className="text-xs text-slate-400">Одоогийн: {fmt(settings.monthlyFee)}₮ / сарын {settings.dueDay}-нд</p>
            </div>
          </div>
          <div className="p-5">
            {settingsSaved && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Тохиргоо хадгалагдлаа.
              </div>
            )}
            <form onSubmit={saveSettings} className="space-y-3">
              <div>
                <label className={labelCls}>Сарын хураамж (₮)</label>
                <input type="number" min="0" className={`${inputCls} w-full`} value={editFee} onChange={e => setEditFee(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Төлөх өдөр</label>
                <input type="number" min="1" max="31" className={`${inputCls} w-full`} value={editDueDay} onChange={e => setEditDueDay(e.target.value)} required />
              </div>
              <button
                type="submit" disabled={savingSettings}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingSettings ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Хадгалж байна...</> : 'Хадгалах'}
              </button>
            </form>
          </div>
        </div>

        {/* Generate bills */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Сарын төлбөр үүсгэх</h2>
              <p className="text-xs text-slate-400">Бүх хэрэглэгчдэд автоматаар үүсгэнэ</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {generateResult && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium">{generateResult.message}</p>
                  <p className="text-xs mt-0.5">{generateResult.created} шинэ, {generateResult.skipped} давхардсан.</p>
                </div>
              </div>
            )}
            <div>
              <label className={labelCls}>Сар сонгох</label>
              <input type="month" className={`${inputCls} w-full`} value={generateMonth} onChange={e => setGenerateMonth(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">
              Тухайн сарын <strong className="text-slate-600">{fmt(settings.monthlyFee)}₮</strong> төлбөрийг бүх хэрэглэгчдэд үүсгэнэ.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={generateBills} disabled={generating}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Үүсгэж байна...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Бүгдэд үүсгэх</>
                )}
              </button>
              <button
                onClick={() => setShowSingleModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Тодорхой айлд төлбөр үүсгэх
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Нийт',             value: stats.total,                    cls: 'text-slate-900', bg: 'bg-slate-50',   border: 'border-slate-200' },
            { label: 'Хүлээгдэж байна', value: stats.pending,                   cls: 'text-amber-600', bg: 'bg-amber-50',   border: 'border-amber-200' },
            { label: 'Төлсөн',          value: stats.completed,                  cls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Нийт дүн',        value: `${fmt(stats.totalAmount)}₮`,    cls: 'text-blue-600',  bg: 'bg-blue-50',    border: 'border-blue-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs + search */}
        <div className="px-5 pt-4 pb-0 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('pending')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Хүлээгдэж байна
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                {pendingList.length}
              </span>
            </button>
            <button
              onClick={() => setTab('paid')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'paid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Төлсөн
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {paidList.length}
              </span>
            </button>
          </div>
          <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Хайх..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-slate-400 px-5 py-2">Мөр дээр дарж дэлгэрэнгүй мэдээлэл харна уу</p>

        {/* List */}
        {error && (
          <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingPayments ? (
          <div className="flex items-center gap-3 text-sm text-slate-400 py-12 justify-center">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            Ачаалж байна...
          </div>
        ) : visibleList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-sm">{tab === 'pending' ? 'Хүлээгдэж буй төлбөр байхгүй' : 'Төлсөн төлбөр байхгүй'}</p>
          </div>
        ) : (
          <div>
            {visibleList.map(p => (
              <PaymentCard key={p._id} payment={p} onClick={setSelectedPayment} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
