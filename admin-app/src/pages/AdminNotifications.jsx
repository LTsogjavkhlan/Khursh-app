import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FormField, { fieldInputCls } from '../components/ui/FormField'

const TYPE_OPTIONS = [
  { value: 'general', label: 'Ерөнхий' },
  { value: 'announcement', label: 'Зарлал' },
  { value: 'event', label: 'Арга хэмжээ' },
  { value: 'payment', label: 'Төлбөр' },
]

const TYPE_META = {
  general:      { label: 'Ерөнхий',   tone: 'slate' },
  announcement: { label: 'Зарлал',     tone: 'blue' },
  event:        { label: 'Арга хэмжээ', tone: 'orange' },
  payment:      { label: 'Төлбөр',     tone: 'green' },
  feedback:     { label: 'Санал',      tone: 'orange' },
}

export default function AdminNotifications() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('general')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/notifications')
      setItems(Array.isArray(data) ? data.filter(n => !n.recipient) : [])
    } catch (err) {
      setError(err.message || 'Мэдэгдэл ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setSending(true)
    try {
      await apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type }),
      })
      setTitle('')
      setMessage('')
      toast.success('Мэдэгдэл амжилттай илгээгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'Мэдэгдэл илгээхэд алдаа гарлаа.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Мэдэгдэл" subtitle="СӨХ-ийн бүх оршин суугчдад мэдэгдэл илгээх." />

      <form onSubmit={handleSend} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <FormField label="Төрөл">
          <select value={type} onChange={e => setType(e.target.value)} className={fieldInputCls}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Гарчиг">
          <input className={fieldInputCls} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Жишээ: Ус таслах тухай" required />
        </FormField>
        <FormField label="Мессеж">
          <textarea className={fieldInputCls} rows={4} value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} placeholder="Дэлгэрэнгүй мэдээллийг энд бичнэ үү..." required />
        </FormField>
        <Button type="submit" loading={sending} disabled={!title.trim() || !message.trim()} className="w-full">
          Илгээх
        </Button>
      </form>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Илгээсэн мэдэгдлүүд</h2>
        {loading ? (
          <Skeleton.List rows={3} />
        ) : items.length === 0 ? (
          <EmptyState title="Илгээсэн мэдэгдэл алга." />
        ) : (
          <ul className="space-y-3">
            {items.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.general
              return (
                <Card key={n._id} className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="text-xs text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('mn-MN') : ''}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                </Card>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
