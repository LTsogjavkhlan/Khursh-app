import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import { CircleDollarSign, AlertTriangle, MessageSquare, Users } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    payments: { total: 0, completed: 0, pending: 0, totalAmount: 0 },
    feedbackOpen: 0,
    pendingMembers: [],
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [paymentsRes, feedbackRes, membersRes] = await Promise.allSettled([
        apiRequest('/api/payments/admin/all'),
        apiRequest('/api/feedback/admin/all'),
        apiRequest('/api/admin/memberships/pending'),
      ])
      if (cancelled) return
      setStats({
        payments: paymentsRes.status === 'fulfilled' ? (paymentsRes.value?.stats || {}) : {},
        feedbackOpen: feedbackRes.status === 'fulfilled'
          ? (Array.isArray(feedbackRes.value) ? feedbackRes.value : []).filter(f => f.status !== 'resolved').length
          : 0,
        pendingMembers: membersRes.status === 'fulfilled' && Array.isArray(membersRes.value) ? membersRes.value : [],
      })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Нүүр хуудас" subtitle="СӨХ-ийн ерөнхий тойм." />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton.Card key={i} />)}
          </div>
          <Skeleton.List rows={3} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Нийт төлбөр (₮)"
              value={Number(stats.payments.totalAmount || 0).toLocaleString('mn-MN')}
              accent="bg-green-100 text-green-700"
              icon={<CircleDollarSign className="w-5 h-5" />}
            />
            <StatCard
              label="Төлөгдөөгүй нэхэмжлэл"
              value={stats.payments.pending || 0}
              accent="bg-yellow-100 text-yellow-700"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
            <StatCard
              label="Нээлттэй санал гомдол"
              value={stats.feedbackOpen}
              accent="bg-red-100 text-red-700"
              icon={<MessageSquare className="w-5 h-5" />}
            />
            <StatCard
              label="Хүлээгдэж буй хүсэлт"
              value={stats.pendingMembers.length}
              accent="bg-blue-100 text-blue-700"
              icon={<Users className="w-5 h-5" />}
            />
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Хүлээгдэж буй гишүүнчлэлийн хүсэлт</h2>
              <Link to="/users" className="text-xs font-medium text-blue-600 hover:text-blue-700">Бүгдийг харах →</Link>
            </div>
            {stats.pendingMembers.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">Хүлээгдэж буй хүсэлт алга.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.pendingMembers.slice(0, 5).map(u => (
                  <li key={u._id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{u.firstName} {u.lastName} <span className="text-slate-400">({u.email})</span></span>
                    <Link to="/users" className="text-xs font-medium text-blue-600 hover:text-blue-700">Харах</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
