import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function isUpcoming(dateStr) {
  return new Date(dateStr) >= new Date(new Date().toDateString())
}

export default function AdminCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  async function loadEvents() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/api/events')
      const list = Array.isArray(data) ? data : []
      setEvents(list.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (err) {
      setError(err.message || 'Үйл явдал ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim() || !date) return
    try {
      setSaving(true)
      setError(null)
      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, date, time, description }),
      })
      setTitle('')
      setDate('')
      setTime('')
      setDescription('')
      await loadEvents()
    } catch (err) {
      setError(err.message || 'Үйл явдал үүсгэхэд алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Энэ үйл явдлыг устгах уу?')) return
    try {
      setDeletingId(id)
      await apiRequest(`/api/events/${id}`, { method: 'DELETE' })
      await loadEvents()
    } catch (err) {
      alert(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setDeletingId(null)
    }
  }

  const upcoming = events.filter(e => isUpcoming(e.date))
  const past = events.filter(e => !isUpcoming(e.date))

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Хуанли</h1>
        <p className="text-sm text-slate-500 mt-1">Байрны үйл явдлуудыг нэмэх, устгах</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Шинэ үйл явдал нэмэх</h2>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Гарчиг</label>
              <input
                className={inputCls}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Жишээ: Лифт засах"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Огноо</label>
              <input
                type="date"
                className={inputCls}
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Цаг <span className="text-slate-400 font-normal">(заавал биш)</span></label>
              <input
                className={inputCls}
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="Жишээ: 10:00 - 14:00"
              />
            </div>
            <div>
              <label className={labelCls}>Тайлбар <span className="text-slate-400 font-normal">(заавал биш)</span></label>
              <input
                className={inputCls}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Дэлгэрэнгүй мэдээлэл"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Нэмэх
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-slate-400 py-8">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Ачаалж байна...
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Одоогоор үйл явдал байхгүй.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Удахгүй болох үйл явдлууд
                <span className="text-slate-400 font-normal">({upcoming.length})</span>
              </h3>
              <EventList events={upcoming} deletingId={deletingId} onDelete={handleDelete} accent />
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                Өнгөрсөн үйл явдлууд
                <span className="text-slate-400 font-normal">({past.length})</span>
              </h3>
              <EventList events={past} deletingId={deletingId} onDelete={handleDelete} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventList({ events, deletingId, onDelete, accent }) {
  return (
    <ul className="space-y-3">
      {events.map(event => (
        <li
          key={event._id}
          className={`bg-white border rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow ${
            accent ? 'border-emerald-200' : 'border-slate-200 opacity-70'
          }`}
        >
          {/* Date badge */}
          <div className={`w-14 flex-shrink-0 rounded-xl text-center py-2 ${accent ? 'bg-emerald-50' : 'bg-slate-100'}`}>
            <p className={`text-xl font-bold leading-tight ${accent ? 'text-emerald-700' : 'text-slate-500'}`}>
              {new Date(event.date).getDate()}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent ? 'text-emerald-600' : 'text-slate-400'}`}>
              {new Date(event.date).toLocaleDateString('mn-MN', { month: 'short' })}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{event.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.date)}
              </span>
              {event.time && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.time}
                </span>
              )}
            </div>
            {event.description && (
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{event.description}</p>
            )}
          </div>

          <button
            onClick={() => onDelete(event._id)}
            disabled={deletingId === event._id}
            className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Устгах"
          >
            {deletingId === event._id ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
