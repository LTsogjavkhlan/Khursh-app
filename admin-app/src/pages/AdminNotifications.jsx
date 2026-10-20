import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { formatDay } from '../utils/format'
import { Send, Megaphone, CalendarDays, CircleDollarSign, Info, MessageSquare, BellRing } from 'lucide-react'

const TYPE_META = {
  general:      { label: 'Ерөнхий',     tone: 'slate',  icon: Info,             tint: 'bg-surface-muted text-ink-secondary' },
  announcement: { label: 'Зарлал',      tone: 'blue',   icon: Megaphone,        tint: 'bg-info-bg text-info-text' },
  event:        { label: 'Арга хэмжээ', tone: 'orange', icon: CalendarDays,     tint: 'bg-brand-soft text-brand-text' },
  payment:      { label: 'Төлбөр',      tone: 'green',  icon: CircleDollarSign, tint: 'bg-success-bg text-success-text' },
  feedback:     { label: 'Санал',       tone: 'orange', icon: MessageSquare,    tint: 'bg-warning-bg text-warning-text' },
}
const TYPE_OPTIONS = ['general', 'announcement', 'event', 'payment']

const TITLE_MAX = 200
const MESSAGE_MAX = 2000

const sentAt = (iso) => {
  const d = new Date(iso)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()} оны ` : ''}${formatDay(d)}, ${time}`
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
      setError(null)
      const data = await apiRequest('/api/notifications')
      // Only broadcasts (no single recipient) belong to this history
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
      toast.success('Мэдэгдэл бүх оршин суугчдад илгээгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'Мэдэгдэл илгээхэд алдаа гарлаа.')
    } finally {
      setSending(false)
    }
  }

  const meta = TYPE_META[type]
  const PreviewIcon = meta.icon

  return (
    <div className="space-y-6">
      <PageHeader title="Мэдэгдэл" subtitle="СӨХ-ийн бүх оршин суугчдын аппад мэдэгдэл илгээх." />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        {/* Composer */}
        <section aria-labelledby="compose-title" className="bg-surface border border-line rounded-card shadow-card p-5 lg:sticky lg:top-24">
          <h2 id="compose-title" className="text-[15px] font-semibold text-ink mb-4">Шинэ мэдэгдэл</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium text-ink-secondary">Төрөл</legend>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map(t => {
                  const active = type === t
                  return (
                    <label key={t} className={`cursor-pointer inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                      active ? 'border-brand bg-brand text-on-brand' : 'border-line text-ink-secondary hover:bg-surface-muted'
                    }`}>
                      <input type="radio" name="notif-type" value={t} checked={active} onChange={() => setType(t)} className="sr-only" />
                      {TYPE_META[t].label}
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <FormField label="Гарчиг">
              <input className={fieldInputCls} value={title} onChange={e => setTitle(e.target.value)} maxLength={TITLE_MAX} autoComplete="off" placeholder="Жишээ: Ус таслах тухай…" required />
            </FormField>
            <FormField label="Мессеж">
              <textarea className={fieldInputCls} rows={5} value={message} onChange={e => setMessage(e.target.value)} maxLength={MESSAGE_MAX} placeholder="Хэзээ, хаана, юу болох талаар товч бичнэ үү…" required />
            </FormField>
            <p className="-mt-2 text-right text-xs text-ink-muted tabular-nums">{message.length}/{MESSAGE_MAX}</p>

            {/* What residents will see */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-secondary">Оршин суугчдад ингэж харагдана</p>
              <div className="flex items-start gap-3 rounded-[14px] border border-line bg-canvas p-3.5" aria-hidden="true">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.tint}`}>
                  <PreviewIcon className="w-[18px] h-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">{title.trim() || 'Гарчиг'}</span>
                    <span className="text-[11px] text-ink-muted shrink-0">Сая</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-secondary line-clamp-3 whitespace-pre-wrap">{message.trim() || 'Мессежийн агуулга энд харагдана.'}</span>
                </span>
              </div>
            </div>

            <Button type="submit" loading={sending} disabled={!title.trim() || !message.trim()} className="w-full">
              {!sending && <Send className="w-4 h-4" aria-hidden="true" />} Бүх оршин суугчдад илгээх
            </Button>
          </form>
        </section>

        {/* History */}
        <section aria-labelledby="history-title" className="min-w-0">
          <h2 id="history-title" className="text-[15px] font-semibold text-ink mb-3">
            Илгээсэн мэдэгдлүүд {!loading && <span className="text-ink-muted font-medium tabular-nums">· {items.length}</span>}
          </h2>
          {error && <p role="alert" className="mb-3 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}
          {loading ? (
            <Skeleton.List rows={3} />
          ) : items.length === 0 ? (
            <EmptyState icon={<BellRing className="w-5 h-5" />} title="Илгээсэн мэдэгдэл алга. Анхны мэдэгдлээ илгээгээрэй." />
          ) : (
            <ul className="bg-surface border border-line rounded-card shadow-card divide-y divide-line">
              {items.map(n => {
                const m = TYPE_META[n.type] || TYPE_META.general
                const Icon = m.icon
                return (
                  <li key={n._id} className="flex items-start gap-3 px-5 py-4">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.tint}`}>
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-ink">{n.title}</p>
                        <Badge tone={m.tone}>{m.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">{n.message}</p>
                      {n.createdAt && <p className="mt-1.5 text-xs text-ink-muted"><time dateTime={n.createdAt}>{sentAt(n.createdAt)}</time></p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
