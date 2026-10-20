import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import CollectionChart from '../components/dashboard/CollectionChart'
import { computeDashboard } from '../utils/dashboardStats'
import { formatMoney, formatPercent, formatMonthShort, formatMonthOf, formatDay } from '../utils/format'
import { CircleDollarSign, Percent, Wallet, MessageSquare, Users, ChevronRight, Receipt } from 'lucide-react'

const PAYMENT_STATUS = {
  completed: { label: 'Төлөгдсөн', tone: 'green' },
  pending: { label: 'Хүлээгдэж буй', tone: 'yellow' },
  processing: { label: 'Боловсруулж байна', tone: 'blue' },
  failed: { label: 'Амжилтгүй', tone: 'red' },
}

const FEEDBACK_TYPE = { complaint: 'Гомдол', suggestion: 'Санал', maintenance: 'Эвдрэл', other: 'Бусад' }

const LINK = 'inline-flex items-center gap-0.5 text-xs font-medium text-brand-text hover:text-brand-hover rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

function Panel({ title, count, action, children, className = '' }) {
  return (
    <section className={`bg-surface border border-line rounded-card shadow-card flex flex-col min-w-0 ${className}`}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          {title}
          {count > 0 && <span className="text-xs font-semibold text-ink-secondary bg-surface-muted rounded-full px-2 py-0.5 tabular-nums">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// Signed change helpers for the stat tiles
const directionOf = (v) => (v > 0.0005 ? 'up' : v < -0.0005 ? 'down' : 'flat')
const amountDelta = (ratio) => ratio == null ? null : {
  direction: directionOf(ratio), good: ratio >= 0,
  text: `${ratio > 0 ? '+' : ratio < 0 ? '−' : ''}${formatPercent(Math.abs(ratio))}`,
}
const pointsDelta = (pts) => pts == null ? null : {
  direction: directionOf(pts / 100), good: pts >= 0,
  text: `${pts > 0 ? '+' : pts < 0 ? '−' : ''}${Math.round(Math.abs(pts))} пункт`,
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(() => computeDashboard({}))

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [paymentsRes, feedbackRes, membersRes, usersRes] = await Promise.allSettled([
        apiRequest('/api/payments/admin/all'),
        apiRequest('/api/feedback/admin/all'),
        apiRequest('/api/admin/memberships/pending'),
        apiRequest('/api/admin/users'),
      ])
      if (cancelled) return
      const ok = (r) => r.status === 'fulfilled'
      setData(computeDashboard({
        payments: ok(paymentsRes) && Array.isArray(paymentsRes.value?.payments) ? paymentsRes.value.payments : [],
        feedback: ok(feedbackRes) && Array.isArray(feedbackRes.value) ? feedbackRes.value : [],
        pending: ok(membersRes) && Array.isArray(membersRes.value) ? membersRes.value : [],
        users: ok(usersRes) && Array.isArray(usersRes.value) ? usersRes.value : [],
      }))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const { current } = data
  const subtitle = [
    user?.hoaName,
    data.residentCount ? `${data.residentCount} идэвхтэй оршин суугч` : null,
    current ? `${current.month.slice(0, 4)} оны ${formatMonthOf(current.month)} байдлаар` : null,
  ].filter(Boolean).join(' · ') || 'СӨХ-ийн ерөнхий тойм.'

  return (
    <div className="space-y-6">
      <PageHeader title="Нүүр хуудас" subtitle={loading ? 'СӨХ-ийн ерөнхий тойм.' : subtitle} />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton.Card key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><Skeleton.Card /></div>
            <Skeleton.Card />
          </div>
          <Skeleton.List rows={3} />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label={current ? `${formatMonthOf(current.month)} цуглуулалт` : 'Энэ сарын цуглуулалт'}
              value={formatMoney(current?.collected)}
              icon={<CircleDollarSign className="w-[18px] h-[18px]" />}
              delta={amountDelta(data.collectedChange)}
              hint={data.collectedChange != null ? 'өмнөх сараас' : null}
            />
            <StatCard
              label="Төлөлтийн хувь"
              value={formatPercent(current?.rate)}
              icon={<Percent className="w-[18px] h-[18px]" />}
              delta={pointsDelta(data.rateChangePoints)}
              hint={data.rateChangePoints != null ? 'өмнөх сараас' : null}
            />
            <StatCard
              label="Нийт үлдэгдэл"
              value={formatMoney(data.outstandingTotal)}
              icon={<Wallet className="w-[18px] h-[18px]" />}
              hint={`${data.unpaidCount} нэхэмжлэл төлөгдөөгүй`}
            />
            <StatCard
              label="Нээлттэй санал, гомдол"
              value={data.openFeedbackCount}
              icon={<MessageSquare className="w-[18px] h-[18px]" />}
              hint={data.inProgressCount ? `${data.inProgressCount} нь шийдэгдэж байна` : 'Шинээр ирсэн'}
            />
          </div>

          {/* Chart + pending requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 min-w-0">
              {data.months.length > 0 ? (
                <CollectionChart months={data.months} />
              ) : (
                <EmptyState
                  icon={<Receipt className="w-5 h-5" />}
                  title="Нэхэмжлэл үүсээгүй байна. Төлбөр хэсгээс сарын нэхэмжлэл үүсгэнэ үү."
                  action={<Link to="/payments" className={LINK}>Төлбөр хэсэг рүү <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></Link>}
                />
              )}
            </div>

            <Panel
              title="Хүлээгдэж буй хүсэлт"
              count={data.pending.length}
              action={<Link to="/users" className={LINK}>Бүгд <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></Link>}
            >
              {data.pending.length === 0 ? (
                <p className="px-5 pb-6 pt-2 text-sm text-ink-muted">Хүлээгдэж буй гишүүнчлэлийн хүсэлт алга.</p>
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {data.pending.slice(0, 5).map(u => (
                    <li key={u._id}>
                      <Link to="/users" className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:bg-surface-muted">
                        <span className="w-8 h-8 rounded-full bg-brand-soft text-brand-text text-[11px] font-bold flex items-center justify-center shrink-0">
                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink truncate">{u.firstName} {u.lastName}</span>
                          <span className="block text-xs text-ink-muted truncate">{u.email}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Recent payments + open feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <Panel
              title="Сүүлийн төлбөрүүд"
              className="lg:col-span-2"
              action={<Link to="/payments" className={LINK}>Бүгд <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></Link>}
            >
              {data.recentPayments.length === 0 ? (
                <p className="px-5 pb-6 pt-2 text-sm text-ink-muted">Төлбөрийн бүртгэл алга.</p>
              ) : (
                <div className="overflow-x-auto border-t border-line">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted">
                        <th scope="col" className="px-5 py-2.5 font-medium">Оршин суугч</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Сар</th>
                        <th scope="col" className="px-3 py-2.5 font-medium text-right">Дүн</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Огноо</th>
                        <th scope="col" className="px-5 py-2.5 font-medium">Төлөв</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.recentPayments.map(p => {
                        const st = PAYMENT_STATUS[p.status] || { label: p.status, tone: 'slate' }
                        const apt = [p.user?.building, p.user?.apartmentNumber].filter(Boolean).join('-')
                        return (
                          <tr key={p._id}>
                            <td className="px-5 py-3">
                              <span className="block font-medium text-ink">{p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Устгагдсан хэрэглэгч'}</span>
                              {apt && <span className="block text-xs text-ink-muted">{apt}</span>}
                            </td>
                            <td className="px-3 py-3 text-ink-secondary whitespace-nowrap">{p.month ? formatMonthShort(p.month) : '—'}</td>
                            <td className="px-3 py-3 text-right font-medium text-ink tabular-nums">{formatMoney(p.amount)}</td>
                            <td className="px-3 py-3 text-ink-secondary whitespace-nowrap">{formatDay(p.paidAt || p.createdAt)}</td>
                            <td className="px-5 py-3"><Badge tone={st.tone} dot>{st.label}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel
              title="Нээлттэй санал, гомдол"
              count={data.openFeedbackCount}
              action={<Link to="/feedback" className={LINK}>Бүгд <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></Link>}
            >
              {data.latestOpenFeedback.length === 0 ? (
                <p className="px-5 pb-6 pt-2 text-sm text-ink-muted">Нээлттэй санал, гомдол алга.</p>
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {data.latestOpenFeedback.map(f => (
                    <li key={f._id}>
                      <Link to="/feedback" className="block px-5 py-3 hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:bg-surface-muted">
                        <span className="flex items-center gap-2">
                          <Badge tone={f.status === 'in_progress' ? 'blue' : 'yellow'}>{FEEDBACK_TYPE[f.type] || 'Бусад'}</Badge>
                          <span className="text-xs text-ink-muted">{formatDay(f.createdAt)}</span>
                        </span>
                        <span className="mt-1.5 block text-sm text-ink line-clamp-2">{f.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
