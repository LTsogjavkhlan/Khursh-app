import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FormField, { fieldInputCls } from '../components/ui/FormField'

const emptyForm = { title: '', description: '', date: '', time: '', location: '' }

export default function AdminCalendar() {
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/api/events')
      setEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Хуанли ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(ev) {
    setEditingId(ev._id)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      date: ev.date ? ev.date.slice(0, 10) : '',
      time: ev.time || '',
      location: ev.location || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    try {
      if (editingId) {
        await apiRequest(`/api/events/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await apiRequest('/api/events', { method: 'POST', body: JSON.stringify(form) })
      }
      toast.success(editingId ? 'Арга хэмжээ шинэчлэгдлээ' : 'Арга хэмжээ нэмэгдлээ')
      cancelEdit()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(id) {
    if (!window.confirm('Энэ арга хэмжээг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/events/${id}`, { method: 'DELETE' })
      toast.success('Арга хэмжээ устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Хуанли" subtitle="СӨХ-ийн арга хэмжээ, уулзалтын мэдээлэл." />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{editingId ? 'Арга хэмжээ засах' : 'Шинэ арга хэмжээ'}</h2>
        <FormField label="Гарчиг">
          <input className={fieldInputCls} placeholder="Гарчиг" value={form.title} maxLength={200}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </FormField>
        <FormField label="Тайлбар">
          <textarea className={fieldInputCls} rows={2} placeholder="Тайлбар" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Огноо">
            <input type="date" className={fieldInputCls} value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </FormField>
          <FormField label="Цаг">
            <input type="time" className={fieldInputCls} value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Байршил">
          <input className={fieldInputCls} placeholder="Байршил" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={saving} disabled={!form.title.trim() || !form.date} className="flex-1">
            {editingId ? 'Хадгалах' : 'Нэмэх'}
          </Button>
          {editingId && <Button type="button" variant="secondary" onClick={cancelEdit}>Цуцлах</Button>}
        </div>
      </form>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : events.length === 0 ? (
        <EmptyState title="Арга хэмжээ алга." />
      ) : (
        <ul className="space-y-3">
          {events.map(ev => (
            <Card key={ev._id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ev.date ? new Date(ev.date).toLocaleDateString('mn-MN') : ''} {ev.time ? `· ${ev.time}` : ''} {ev.location ? `· ${ev.location}` : ''}
                </p>
                {ev.description && <p className="text-sm text-slate-600 mt-1">{ev.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => startEdit(ev)}>Засах</Button>
                <Button variant="danger" size="sm" disabled={busyId === ev._id} onClick={() => removeEvent(ev._id)}>Устгах</Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
