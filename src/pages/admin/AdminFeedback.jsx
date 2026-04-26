import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'

const STATUS_META = {
  open:        { label: 'Нээлттэй',       cls: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  in_progress: { label: 'Ажиллаж байна', cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  resolved:    { label: 'Шийдэгдсэн',    cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

const TYPE_META = {
  complaint:   { label: 'Гомдол',       cls: 'bg-red-50 text-red-600 border border-red-200' },
  suggestion:  { label: 'Санал',         cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  maintenance: { label: 'Эвдрэл гэмтэл', cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
  other:       { label: 'Бусад',          cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors'

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  )
}

export default function AdminFeedback() {
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
      alert(err.message || 'Төлөв өөрчлөхөд алдаа гарлаа.')
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
      await loadFeedback()
    } catch (err) {
      alert(err.message || 'Хариу илгээхэд алдаа гарлаа.')
    } finally {
      setReplyingId(null)
    }
  }

  const STATUS_ACTIONS = [
    { status: 'open',        label: 'Нээлттэй',       cls: 'border-slate-200 text-slate-600 hover:bg-slate-50' },
    { status: 'in_progress', label: 'Ажиллаж байна',  cls: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' },
    { status: 'resolved',    label: 'Шийдэгдсэн',     cls: 'border-green-200 text-green-700 hover:bg-green-50' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Санал, гомдол</h1>
        <p className="text-sm text-slate-500 mt-1">Оршин суугчдаас ирсэн санал гомдлыг эндээс харна.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-slate-400 py-8">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Ачаалж байна...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm">Одоогоор ирсэн санал гомдол алга.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map(item => {
            const id = item._id || item.id
            const typeMeta = TYPE_META[item.type] || TYPE_META.other
            return (
              <li key={id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar — shows building/apt initials */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 flex-shrink-0 leading-tight text-center">
                      {item.user?.building
                        ? <>{item.user.building}<br/>{item.user.apartmentNumber || '?'}</>
                        : (item.user?.apartmentNumber || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Address as primary identifier */}
                        <p className="text-sm font-semibold text-slate-900">
                          {[
                            item.user?.building    ? `${item.user.building}-р байр` : null,
                            item.user?.entrance    ? `${item.user.entrance}-р орц`  : null,
                            item.user?.floor       ? `${item.user.floor}-р давхар`  : null,
                            item.user?.apartmentNumber ? `${item.user.apartmentNumber}-р тоот` : null,
                          ].filter(Boolean).join(', ') || '—'}
                        </p>
                        {/* Name as secondary badge */}
                        {(item.user?.firstName || item.user?.lastName) && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {item.user.firstName} {item.user.lastName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeMeta.cls}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('mn-MN') : ''}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Content */}
                  {item.title && (
                    <p className="mt-3 text-sm font-semibold text-slate-800 ml-14">{item.title}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed ml-14">{item.description}</p>

                  {/* Admin reply display */}
                  {item.adminResponse && (
                    <div className="mt-4 ml-14 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Админы хариу
                      </p>
                      <p className="text-sm text-blue-800">{item.adminResponse}</p>
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {/* Status buttons */}
                  <div className="flex gap-1.5">
                    {STATUS_ACTIONS.map(a => (
                      <button
                        key={a.status}
                        type="button"
                        disabled={updatingId === id}
                        onClick={() => updateStatus(id, a.status)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          item.status === a.status
                            ? 'bg-slate-900 text-white border-slate-900'
                            : a.cls
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {/* Reply button */}
                  {expandedReply !== id && (
                    <button
                      onClick={() => setExpandedReply(id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      {item.adminResponse ? 'Хариу засах' : 'Хариу бичих'}
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {expandedReply === id && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                    <textarea
                      className={inputCls}
                      rows={3}
                      placeholder="Хариуг энд бичнэ үү..."
                      value={replyText[id] || ''}
                      onChange={e => setReplyText(prev => ({ ...prev, [id]: e.target.value }))}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setExpandedReply(null)}
                        className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Цуцлах
                      </button>
                      <button
                        disabled={replyingId === id}
                        onClick={() => sendReply(id)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {replyingId === id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Илгээж байна...
                          </>
                        ) : 'Илгээх'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
