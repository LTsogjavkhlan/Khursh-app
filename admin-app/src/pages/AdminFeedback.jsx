import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { fieldInputCls } from '../components/ui/FormField'

const STATUS_META = {
  open:        { label: 'Нээлттэй',       tone: 'red' },
  in_progress: { label: 'Ажиллаж байна', tone: 'yellow' },
  resolved:    { label: 'Шийдэгдсэн',    tone: 'green' },
}

const TYPE_META = {
  complaint:   { label: 'Гомдол',       tone: 'red' },
  suggestion:  { label: 'Санал',         tone: 'blue' },
  maintenance: { label: 'Эвдрэл гэмтэл', tone: 'orange' },
  other:       { label: 'Бусад',          tone: 'slate' },
}

const STATUS_ACTIONS = [
  { status: 'open',        label: 'Нээлттэй' },
  { status: 'in_progress', label: 'Ажиллаж байна' },
  { status: 'resolved',    label: 'Шийдэгдсэн' },
]

export default function AdminFeedback() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [replyingId, setReplyingId] = useState(null)
  const [expandedReply, setExpandedReply] = useState(null)

  async function loadFeedback() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/api/feedback/admin/all')
      const list = Array.isArray(data) ? data : data?.feedback || []
      setItems(list)
    } catch (err) {
      setError(err.message || 'Санал гомдол ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeedback() }, [])

  async function updateStatus(id, status) {
    try {
      setUpdatingId(id)
      await apiRequest(`/api/feedback/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setItems(prev => prev.map(i => (i._id || i.id) === id ? { ...i, status } : i))
    } catch (err) {
      toast.error(err.message || 'Төлөв өөрчлөхөд алдаа гарлаа.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function sendReply(id) {
    const text = replyText[id]?.trim()
    if (!text) return
    try {
      setReplyingId(id)
      await apiRequest(`/api/feedback/admin/${id}/respond`, {
        method: 'PUT',
        body: JSON.stringify({ adminResponse: text }),
      })
      setReplyText(prev => ({ ...prev, [id]: '' }))
      setExpandedReply(null)
      toast.success('Хариу илгээгдлээ')
      await loadFeedback()
    } catch (err) {
      toast.error(err.message || 'Хариу илгээхэд алдаа гарлаа.')
    } finally {
      setReplyingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Санал, гомдол" subtitle="Оршин суугчдаас ирсэн санал гомдлыг эндээс харна." />

      {error && (
        <div className="rounded-xl bg-danger-bg border border-danger-bg px-4 py-3 text-sm text-danger-text">{error}</div>
      )}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : items.length === 0 ? (
        <EmptyState title="Одоогоор ирсэн санал гомдол алга." />
      ) : (
        <ul className="space-y-4">
          {items.map(item => {
            const id = item._id || item.id
            const typeMeta = TYPE_META[item.type] || TYPE_META.other
            const statusMeta = STATUS_META[item.status] || { label: item.status, tone: 'slate' }
            return (
              <Card key={id} className="overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-[11px] font-bold text-ink-secondary flex-shrink-0 leading-tight text-center">
                      {item.user?.building
                        ? <>{item.user.building}<br/>{item.user.apartmentNumber || '?'}</>
                        : (item.user?.apartmentNumber || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {[
                            item.user?.building    ? `${item.user.building}-р байр` : null,
                            item.user?.entrance    ? `${item.user.entrance}-р орц`  : null,
                            item.user?.floor       ? `${item.user.floor}-р давхар`  : null,
                            item.user?.apartmentNumber ? `${item.user.apartmentNumber}-р тоот` : null,
                          ].filter(Boolean).join(', ') || '—'}
                        </p>
                        {(item.user?.firstName || item.user?.lastName) && (
                          <span className="text-xs text-ink-muted bg-surface-muted px-2 py-0.5 rounded-full">
                            {item.user.firstName} {item.user.lastName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                        <span className="text-xs text-ink-muted">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('mn-MN') : ''}
                        </span>
                      </div>
                    </div>
                    <Badge tone={statusMeta.tone} dot>{statusMeta.label}</Badge>
                  </div>

                  {item.title && (
                    <p className="mt-3 text-sm font-semibold text-ink ml-14">{item.title}</p>
                  )}
                  <p className="mt-1 text-sm text-ink-secondary leading-relaxed ml-14">{item.description}</p>

                  {item.images?.length > 0 && (
                    <div className="mt-3 ml-14 flex flex-wrap gap-2">
                      {item.images.map((img, i) => (
                        <a
                          key={img.publicId || i}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-line hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
                          aria-label={`Зураг ${i + 1}-г томоор харах`}
                        >
                          <img
                            src={img.thumbUrl || img.url}
                            alt=""
                            width={80}
                            height={80}
                            loading="lazy"
                            className="w-20 h-20 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {item.adminResponse && (
                    <div className="mt-4 ml-14 p-3 bg-brand-soft rounded-xl border border-brand-soft">
                      <p className="text-xs font-semibold text-brand-text mb-1">Админы хариу</p>
                      <p className="text-sm text-ink">{item.adminResponse}</p>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-surface-muted border-t border-line flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_ACTIONS.map(a => (
                      <button
                        key={a.status}
                        type="button"
                        disabled={updatingId === id}
                        onClick={() => updateStatus(id, a.status)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 disabled:opacity-50 ${
                          item.status === a.status ? 'bg-brand text-white border-brand' : 'border-line text-ink-secondary hover:bg-surface'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {expandedReply !== id && (
                    <Button variant="secondary" size="sm" onClick={() => setExpandedReply(id)}>
                      {item.adminResponse ? 'Хариу засах' : 'Хариу бичих'}
                    </Button>
                  )}
                </div>

                {expandedReply === id && (
                  <div className="px-5 pb-5 pt-3 border-t border-line space-y-3">
                    <textarea
                      className={fieldInputCls}
                      rows={3}
                      placeholder="Хариуг энд бичнэ үү..."
                      value={replyText[id] || ''}
                      onChange={e => setReplyText(prev => ({ ...prev, [id]: e.target.value }))}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => setExpandedReply(null)}>Цуцлах</Button>
                      <Button size="sm" loading={replyingId === id} onClick={() => sendReply(id)}>Илгээх</Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </ul>
      )}
    </div>
  )
}
