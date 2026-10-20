import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FilterTabs from '../components/ui/FilterTabs'
import SearchInput from '../components/ui/SearchInput'
import { fieldInputCls } from '../components/ui/FormField'
import { addressLine, formatDay } from '../utils/format'
import { MessageSquareText, MessageSquareReply, Pencil } from 'lucide-react'

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

const STATUSES = ['open', 'in_progress', 'resolved']

const fullName = (u) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
const apartmentOf = (u) => [u?.building, u?.apartmentNumber].filter(Boolean).join('-')
const initialsOf = (u) => ((u?.firstName?.[0] || '') + (u?.lastName?.[0] || '')).toUpperCase() || '?'

// Three-way status control: a radio group so the current state is announced
function StatusControl({ value, onChange, disabled, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] bg-surface-muted p-0.5">
      {STATUSES.map(s => {
        const active = value === s
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(s)}
            className={`h-8 px-3 rounded-[8px] text-xs font-semibold transition-colors disabled:opacity-60 ${FOCUS_RING} ${
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {STATUS_META[s].label}
          </button>
        )
      })}
    </div>
  )
}

export default function AdminFeedback() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [replyingId, setReplyingId] = useState(null)
  const [expandedReply, setExpandedReply] = useState(null)

  async function loadFeedback() {
    try {
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
      toast.success(`Төлөв: ${STATUS_META[status].label}`)
    } catch (err) {
      toast.error(err.message || 'Төлөв өөрчлөхөд алдаа гарлаа.')
    } finally {
      setUpdatingId(null)
    }
  }

  function openReply(item) {
    const id = item._id || item.id
    // Editing starts from the existing reply instead of an empty box
    setReplyText(prev => ({ ...prev, [id]: prev[id] ?? item.adminResponse ?? '' }))
    setExpandedReply(id)
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
      setReplyText(prev => { const next = { ...prev }; delete next[id]; return next })
      setExpandedReply(null)
      toast.success('Хариу илгээгдлээ')
      await loadFeedback()
    } catch (err) {
      toast.error(err.message || 'Хариу илгээхэд алдаа гарлаа.')
    } finally {
      setReplyingId(null)
    }
  }

  const counts = useMemo(() => {
    const c = { all: items.length }
    for (const s of STATUSES) c[s] = items.filter(i => i.status === s).length
    return c
  }, [items])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(i =>
      (filter === 'all' || i.status === filter) &&
      (!q || [i.title, i.description, fullName(i.user), apartmentOf(i.user), TYPE_META[i.type]?.label]
        .some(v => v && String(v).toLowerCase().includes(q))))
  }, [items, filter, query])

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Санал, гомдол" subtitle="Оршин суугчдаас ирсэн санал, гомдол, эвдрэлийн мэдэгдэл." />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <FilterTabs
              label="Төлөвөөр шүүх"
              value={filter}
              onChange={setFilter}
              tabs={[{ id: 'all', label: 'Бүгд', count: counts.all }, ...STATUSES.map(s => ({ id: s, label: STATUS_META[s].label, count: counts[s] }))]}
            />
            <SearchInput className="lg:ml-auto lg:w-72" label="Санал гомдол хайх" placeholder="Агуулга, нэр эсвэл тоот…" value={query} onChange={setQuery} />
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={<MessageSquareText className="w-5 h-5" />}
              title={items.length === 0 ? 'Одоогоор ирсэн санал гомдол алга.' : 'Шүүлтэд тохирох санал гомдол олдсонгүй.'}
            />
          ) : (
            <ul className="space-y-4">
              {list.map(item => {
                const id = item._id || item.id
                const typeMeta = TYPE_META[item.type] || TYPE_META.other
                const statusMeta = STATUS_META[item.status] || { label: item.status, tone: 'slate' }
                const name = fullName(item.user)
                return (
                  <li key={id}>
                    <article className="bg-surface border border-line rounded-card shadow-card overflow-hidden" aria-labelledby={`fb-${id}`}>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <span aria-hidden="true" className="w-10 h-10 rounded-full bg-brand-soft text-brand-text flex items-center justify-center text-xs font-bold shrink-0">
                            {initialsOf(item.user)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink">
                              {name || 'Устгагдсан хэрэглэгч'}
                              {apartmentOf(item.user) && <span className="ml-2 font-semibold text-ink-muted tabular-nums whitespace-nowrap">{apartmentOf(item.user)}</span>}
                            </p>
                            <p className="text-xs text-ink-muted truncate">
                              {item.user ? addressLine(item.user) : ''}
                              {item.createdAt && <> · <time dateTime={item.createdAt}>{formatDay(item.createdAt)}</time></>}
                            </p>
                          </div>
                          <Badge tone={statusMeta.tone} dot className="hidden sm:inline-flex">{statusMeta.label}</Badge>
                        </div>

                        <div className="mt-4 sm:ml-[52px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                            {item.title && <h2 id={`fb-${id}`} className="text-[15px] font-semibold text-ink">{item.title}</h2>}
                          </div>
                          <p id={item.title ? undefined : `fb-${id}`} className="mt-2 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">{item.description}</p>

                          {item.images?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.images.map((img, i) => (
                                <a
                                  key={img.publicId || i}
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block rounded-xl overflow-hidden border border-line hover:border-line-strong transition-colors ${FOCUS_RING}`}
                                  aria-label={`Зураг ${i + 1}-г томоор харах`}
                                >
                                  <img src={img.thumbUrl || img.url} alt="" width={80} height={80} loading="lazy" className="w-20 h-20 object-cover" />
                                </a>
                              ))}
                            </div>
                          )}

                          {item.adminResponse && expandedReply !== id && (
                            <div className="mt-4 rounded-xl bg-brand-soft p-3">
                              <p className="text-xs font-semibold text-brand-text mb-1">Таны хариу</p>
                              <p className="text-sm text-ink whitespace-pre-wrap">{item.adminResponse}</p>
                            </div>
                          )}

                          {expandedReply === id && (
                            <form
                              className="mt-4 space-y-3"
                              onSubmit={e => { e.preventDefault(); sendReply(id) }}
                            >
                              <label htmlFor={`reply-${id}`} className="block text-xs font-semibold text-ink-secondary">Оршин суугчид өгөх хариу</label>
                              <textarea
                                id={`reply-${id}`}
                                className={fieldInputCls}
                                rows={3}
                                placeholder="Хариуг энд бичнэ үү…"
                                value={replyText[id] || ''}
                                onChange={e => setReplyText(prev => ({ ...prev, [id]: e.target.value }))}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setExpandedReply(null)}>Болих</Button>
                                <Button type="submit" size="sm" loading={replyingId === id} disabled={!replyText[id]?.trim()}>Хариу илгээх</Button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-surface-muted/60 border-t border-line flex flex-wrap items-center justify-between gap-3">
                        <StatusControl
                          label={`${item.title || 'Санал гомдол'} — төлөв`}
                          value={item.status}
                          disabled={updatingId === id}
                          onChange={s => updateStatus(id, s)}
                        />
                        {expandedReply !== id && (
                          <Button variant="secondary" size="sm" onClick={() => openReply(item)}>
                            {item.adminResponse
                              ? <><Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Хариу засах</>
                              : <><MessageSquareReply className="w-4 h-4" aria-hidden="true" /> Хариу бичих</>}
                          </Button>
                        )}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
