import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'

const TYPE_OPTIONS = [
  { value: 'general',      label: 'Ерөнхий',            icon: '📢', cls: 'bg-slate-100 text-slate-700' },
  { value: 'announcement', label: 'Зар мэдэгдэл',       icon: '📣', cls: 'bg-blue-100 text-blue-700' },
  { value: 'payment',      label: 'Төлбөрийн сануулга', icon: '💳', cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'event',        label: 'Үйл явдал',           icon: '📅', cls: 'bg-emerald-100 text-emerald-700' },
]

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'Дөнгөж сая'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин өмнө`
  if (diff < 86400) return `${Math.floor(diff / 3600)} цаг өмнө`
  return `${Math.floor(diff / 86400)} өдөр өмнө`
}

export default function AdminNotifications() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('general')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  async function loadHistory() {
    try {
      const data = await apiRequest('/api/notifications')
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => { loadHistory() }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    try {
      setSending(true)
      setError(null)
      await apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title, message, type }),
      })
      setTitle('')
      setMessage('')
      setType('general')
      setSent(true)
      setTimeout(() => setSent(false), 4000)
      await loadHistory()
    } catch (err) {
      setError(err.message || 'Мэдэгдэл илгээхэд алдаа гарлаа.')
    } finally {
      setSending(false)
    }
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Мэдэгдэл илгээх</h1>
        <p className="text-sm text-slate-500 mt-1">Бүх оршин суугчдад нэгэн зэрэг мэдэгдэл илгээх</p>
      </div>

      {/* Success */}
      {sent && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Мэдэгдэл амжилттай бүх хэрэглэгчдэд илгээгдлээ.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Compose form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Шинэ мэдэгдэл бичих</h2>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Гарчиг</label>
            <input
              className={inputCls}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Мэдэгдлийн гарчиг"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Агуулга</label>
            <textarea
              className={inputCls}
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Мэдэгдлийн агуулгыг бичнэ үү..."
              required
            />
          </div>
          <div>
            <label className={labelCls}>Төрөл</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    type === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              Сонгосон: <span className="font-medium text-slate-600">{selectedType?.label}</span>
            </p>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Илгээж байна...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Бүгдэд илгээх
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Илгээсэн мэдэгдлүүд
          {!loadingHistory && <span className="ml-2 text-slate-400 font-normal">({history.length})</span>}
        </h2>

        {loadingHistory ? (
          <div className="flex items-center gap-3 text-sm text-slate-400 py-6">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            Ачаалж байна...
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">Одоогоор илгээсэн мэдэгдэл байхгүй.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map(n => {
              const typeMeta = TYPE_OPTIONS.find(t => t.value === n.type) || TYPE_OPTIONS[0]
              return (
                <li key={n._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${typeMeta.cls}`}>
                      {typeMeta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{n.title}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {n.createdAt ? timeAgo(n.createdAt) : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{n.message}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeMeta.cls}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {n.readBy?.length || 0} хүн уншсан
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
