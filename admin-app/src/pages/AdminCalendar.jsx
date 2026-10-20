import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import IconAction from '../components/ui/IconAction'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import FilterTabs from '../components/ui/FilterTabs'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { Plus, Pencil, Trash2, Clock, MapPin, CalendarDays } from 'lucide-react'

const emptyForm = { title: '', description: '', date: '', time: '', location: '' }
const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

// Event dates are stored as midnight UTC; read the calendar day from the ISO
// string so the day never shifts with the viewer's timezone.
const dayParts = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return { y, m, d, weekday: WEEKDAYS[new Date(y, m - 1, d).getDay()] }
}
const todayKey = () => {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function AdminCalendar() {
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('upcoming')
  const [form, setForm] = useState(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    try {
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

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function startEdit(ev) {
    setEditingId(ev._id)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      date: ev.date ? ev.date.slice(0, 10) : '',
      time: ev.time || '',
      location: ev.location || '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
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
      closeDialog()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(ev) {
    if (!window.confirm(`«${ev.title}» арга хэмжээг устгах уу?`)) return
    try {
      setBusyId(ev._id)
      await apiRequest(`/api/events/${ev._id}`, { method: 'DELETE' })
      toast.success('Арга хэмжээ устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  const { upcoming, past } = useMemo(() => {
    const today = todayKey()
    const sorted = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')))
    return {
      upcoming: sorted.filter(e => String(e.date).slice(0, 10) >= today),
      past: sorted.filter(e => String(e.date).slice(0, 10) < today).reverse(),
    }
  }, [events])

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Хуанли"
        subtitle="СӨХ-ийн арга хэмжээ, уулзалтын мэдээлэл. Оршин суугчдын аппын хуанлид харагдана."
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Арга хэмжээ нэмэх</Button>}
      />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : (
        <section className="bg-surface border border-line rounded-card shadow-card" aria-label="Арга хэмжээний жагсаалт">
          <div className="p-4 border-b border-line">
            <FilterTabs
              label="Хугацаагаар шүүх"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'upcoming', label: 'Удахгүй болох', count: upcoming.length },
                { id: 'past', label: 'Өнгөрсөн', count: past.length },
              ]}
            />
          </div>

          {list.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<CalendarDays className="w-5 h-5" />}
                title={tab === 'upcoming' ? 'Удахгүй болох арга хэмжээ алга.' : 'Өнгөрсөн арга хэмжээ алга.'}
                action={tab === 'upcoming' && <Button variant="secondary" size="sm" onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Арга хэмжээ нэмэх</Button>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.map(ev => {
                const p = ev.date ? dayParts(ev.date) : null
                return (
                  <li key={ev._id} className={`flex items-start gap-4 px-5 py-4 ${tab === 'past' ? 'opacity-75' : ''}`}>
                    {p && (
                      <span className="w-14 shrink-0 rounded-[10px] bg-brand-soft text-brand-text text-center py-1.5">
                        <span className="block text-[11px] font-semibold">{p.m}-р сар</span>
                        <span className="block text-xl font-bold leading-tight tabular-nums">{p.d}</span>
                        <span className="block text-[10px] font-medium">{p.weekday}</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink">{ev.title}</p>
                      {(ev.time || ev.location) && (
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                          {ev.time && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{ev.time}</span>}
                          {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{ev.location}</span>}
                        </p>
                      )}
                      {ev.description && <p className="mt-1.5 text-sm text-ink-secondary leading-relaxed">{ev.description}</p>}
                    </div>
                    <div className="flex shrink-0 -mr-2">
                      <IconAction label={`«${ev.title}» засах`} onClick={() => startEdit(ev)}><Pencil className="w-4 h-4" aria-hidden="true" /></IconAction>
                      <IconAction label={`«${ev.title}» устгах`} danger disabled={busyId === ev._id} onClick={() => removeEvent(ev)}><Trash2 className="w-4 h-4" aria-hidden="true" /></IconAction>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <Modal open={dialogOpen} onClose={closeDialog} title={editingId ? 'Арга хэмжээ засах' : 'Шинэ арга хэмжээ'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Гарчиг">
            <input className={fieldInputCls} placeholder="Жишээ: Оршин суугчдын хурал…" value={form.title} maxLength={200} autoComplete="off"
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Огноо">
              <input type="date" className={fieldInputCls} value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </FormField>
            <FormField label="Цаг (заавал биш)">
              <input type="time" className={fieldInputCls} value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Байршил (заавал биш)">
            <input className={fieldInputCls} placeholder="Жишээ: 1-р давхрын заал…" value={form.location} autoComplete="off"
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </FormField>
          <FormField label="Тайлбар (заавал биш)">
            <textarea className={fieldInputCls} rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeDialog}>Болих</Button>
            <Button type="submit" loading={saving} disabled={!form.title.trim() || !form.date}>
              {editingId ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
