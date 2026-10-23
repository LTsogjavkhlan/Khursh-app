import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FilterTabs from '../components/ui/FilterTabs'
import { formatMoney, formatDay } from '../utils/format'
import { periodLabel } from '../utils/reports'
import { Plus, FileBarChart2, ChevronRight, Paperclip } from 'lucide-react'

export default function AdminReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    apiRequest('/api/reports/admin/all')
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Тайлан ачаалахад алдаа гарлаа.'))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => ({
    all: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    published: reports.filter(r => r.status === 'published').length,
  }), [reports])
  const list = tab === 'all' ? reports : reports.filter(r => r.status === tab)

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Тайлан"
        subtitle="Ил тод байдлын тайлан: хийгдсэн ажил, орлого, зарлага. Нийтэлсэн тайлан оршин суугчдын аппад харагдана."
        action={<Button onClick={() => navigate('/reports/new')}><Plus className="w-4 h-4" aria-hidden="true" /> Тайлан үүсгэх</Button>}
      />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : (
        <section className="bg-surface border border-line rounded-card shadow-card" aria-label="Тайлангийн жагсаалт">
          <div className="p-4 border-b border-line">
            <FilterTabs
              label="Төлөвөөр шүүх"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'all', label: 'Бүгд', count: counts.all },
                { id: 'draft', label: 'Ноорог', count: counts.draft },
                { id: 'published', label: 'Нийтэлсэн', count: counts.published },
              ]}
            />
          </div>
          {list.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<FileBarChart2 className="w-5 h-5" />}
                title={reports.length === 0
                  ? 'Тайлан үүсгээгүй байна. Анхны тайлангаа үүсгэж, оршин суугчдад СӨХ-ийн ажил, санхүүг ил тод харуулаарай.'
                  : 'Энэ төлөвт тайлан алга.'}
                action={reports.length === 0 && <Button variant="secondary" size="sm" onClick={() => navigate('/reports/new')}><Plus className="w-4 h-4" aria-hidden="true" /> Тайлан үүсгэх</Button>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.map(r => {
                const published = r.status === 'published'
                const period = periodLabel(r.periodStart, r.periodEnd)
                return (
                  <li key={r._id}>
                    <Link to={`/reports/${r._id}`} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60 ${FOCUS_RING}`}>
                      <span className="w-10 h-10 rounded-full bg-brand-soft text-brand-text flex items-center justify-center shrink-0">
                        <FileBarChart2 className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{r.title}</span>
                          {published ? <Badge tone="green" dot>Нийтэлсэн</Badge> : <Badge tone="slate">Ноорог</Badge>}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {[
                            period,
                            published && r.publishedAt ? `${formatDay(r.publishedAt)}-нд нийтэлсэн` : `${formatDay(r.updatedAt)}-нд засварласан`,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="hidden sm:flex flex-col items-end text-xs text-ink-muted shrink-0 tabular-nums">
                        {r.totals?.expense != null && <span>Зарлага <span className="font-semibold text-ink">{formatMoney(r.totals.expense)}</span></span>}
                        {r.attachments?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" aria-hidden="true" />{r.attachments.length}</span>}
                      </span>
                      <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
