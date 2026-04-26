import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../api/client'

const FEEDBACK_STATUS_LABELS = {
  open: 'Нээлттэй',
  in_progress: 'Шийдвэрлэж байна',
  resolved: 'Шийдвэрлэгдсэн',
  closed: 'Хаагдсан',
}
const FEEDBACK_STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
}
const PAYMENT_STATUS_LABELS = {
  pending: 'Хүлээгдэж байна',
  completed: 'Төлсөн',
  failed: 'Амжилтгүй',
  processing: 'Боловсруулж байна',
}
const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
}

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('mn-MN')
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'Дөнгөж сая'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин өмнө`
  if (diff < 86400) return `${Math.floor(diff / 3600)} цаг өмнө`
  return `${Math.floor(diff / 86400)} өдөр өмнө`
}

function StatCard({ gradient, icon, label, value, sub, to }) {
  const card = (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-black/10 ${gradient} ${to ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-1 w-16 h-16 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-3xl mb-3">{icon}</div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{card}</Link> : card
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: null, openFeedback: null, pendingPayments: null, monthlyFee: null })
  const [recentFeedback, setRecentFeedback] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      setError(null)
      try {
        const [usersRes, feedbackRes, paymentsRes, settingsRes] = await Promise.allSettled([
          apiRequest('/api/admin/users'),
          apiRequest('/api/feedback/admin/all'),
          apiRequest('/api/payments/admin/all'),
          apiRequest('/api/payments/settings'),
        ])

        let totalUsers = null, openFeedback = null, pendingPayments = null, monthlyFee = null
        let feedbackList = [], paymentList = []

        if (usersRes.status === 'fulfilled') {
          const users = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.users ?? [])
          totalUsers = users.length
        }
        if (feedbackRes.status === 'fulfilled') {
          feedbackList = Array.isArray(feedbackRes.value) ? feedbackRes.value : (feedbackRes.value?.feedback ?? [])
          openFeedback = feedbackList.filter(f => f.status === 'open' || f.status === 'in_progress').length
        }
        if (paymentsRes.status === 'fulfilled') {
          paymentList = Array.isArray(paymentsRes.value?.payments) ? paymentsRes.value.payments : []
          pendingPayments = paymentList.filter(p => p.status === 'pending').length
        }
        if (settingsRes.status === 'fulfilled') {
          monthlyFee = settingsRes.value?.monthlyFee ?? null
        }

        setStats({ totalUsers, openFeedback, pendingPayments, monthlyFee })
        setRecentFeedback(feedbackList.slice(0, 5))
        setRecentPayments(paymentList.slice(0, 5))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Уншиж байна...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-sm flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Алдаа гарлаа: {error}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Нүүр хуудас</h1>
        <p className="text-sm text-slate-500 mt-1">Голден Хилл СӨХ-ийн ерөнхий байдал</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon="👥"
          label="Оршин суугчид"
          value={stats.totalUsers ?? '—'}
          sub="Бүртгэлтэй хэрэглэгч"
          to="/admin/users"
        />
        <StatCard
          gradient="bg-gradient-to-br from-rose-500 to-red-700"
          icon="📋"
          label="Нээлттэй гомдол"
          value={stats.openFeedback ?? '—'}
          sub="Шийдвэрлэх шаардлагатай"
          to="/admin/feedback"
        />
        <StatCard
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon="💳"
          label="Хүлээгдэж буй төлбөр"
          value={stats.pendingPayments ?? '—'}
          sub="Батлагдаагүй төлбөр"
          to="/admin/payments"
        />
        <StatCard
          gradient="bg-gradient-to-br from-emerald-500 to-green-700"
          icon="💰"
          label="Сарын хураамж"
          value={stats.monthlyFee != null ? `${fmt(stats.monthlyFee)}₮` : '—'}
          sub="Одоогийн тариф"
          to="/admin/payments"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Сүүлийн гомдлууд</h3>
            <Link to="/admin/feedback" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Бүгдийг харах
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {recentFeedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm">Гомдол байхгүй</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentFeedback.map(item => (
                <li key={item._id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                    {(item.user?.firstName?.[0] ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.user?.firstName} {item.user?.lastName} · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${FEEDBACK_STATUS_COLORS[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {FEEDBACK_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Сүүлийн төлбөрүүд</h3>
            <Link to="/admin/payments" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Бүгдийг харах
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm">Төлбөр байхгүй</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map(item => (
                <li key={item._id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                    {(item.user?.firstName?.[0] ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.user?.firstName} {item.user?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fmt(item.amount)}₮ · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${PAYMENT_STATUS_COLORS[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {PAYMENT_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
