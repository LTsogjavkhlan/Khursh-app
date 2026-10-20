import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import IconAction from '../components/ui/IconAction'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { Building2, Flame, Zap, Droplets, Wrench, ArrowUpDown, ShieldCheck, Wifi, PhoneCall, Plus, Pencil, Trash2, Phone, Mail, BookUser } from 'lucide-react'

const CATEGORIES = [
  { value: 'hoa',         label: 'СӨХ',            icon: Building2,   tint: 'bg-brand-soft text-brand-text' },
  { value: 'heating',     label: 'Дулаан',         icon: Flame,       tint: 'bg-danger-bg text-danger-text' },
  { value: 'electricity', label: 'Цахилгаан',      icon: Zap,         tint: 'bg-warning-bg text-warning-text' },
  { value: 'water',       label: 'Ус',             icon: Droplets,    tint: 'bg-info-bg text-info-text' },
  { value: 'plumbing',    label: 'Сантехник',      icon: Wrench,      tint: 'bg-info-bg text-info-text' },
  { value: 'elevator',    label: 'Цахилгаан шат',  icon: ArrowUpDown, tint: 'bg-surface-muted text-ink-secondary' },
  { value: 'security',    label: 'Хамгаалалт',     icon: ShieldCheck, tint: 'bg-success-bg text-success-text' },
  { value: 'internet',    label: 'Интернет',       icon: Wifi,        tint: 'bg-info-bg text-info-text' },
  { value: 'other',       label: 'Бусад',          icon: PhoneCall,   tint: 'bg-surface-muted text-ink-secondary' },
]
const CATEGORY = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

const emptyForm = { name: '', category: 'other', phone: '', email: '', description: '', order: 0 }

export default function AdminContact() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    try {
      setError(null)
      const data = await apiRequest('/api/contacts')
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Ачаалахад алдаа гарлаа.')
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

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      name: item.name || '',
      category: item.category || 'other',
      phone: item.phone || '',
      email: item.email || '',
      description: item.description || '',
      order: item.order || 0,
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
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await apiRequest(`/api/contacts/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await apiRequest('/api/contacts', { method: 'POST', body: JSON.stringify(form) })
      }
      toast.success(editingId ? 'Үйлчилгээ шинэчлэгдлээ' : 'Үйлчилгээ нэмэгдлээ')
      closeDialog()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`«${item.name}» үйлчилгээг устгах уу?`)) return
    try {
      setBusyId(item._id)
      await apiRequest(`/api/contacts/${item._id}`, { method: 'DELETE' })
      toast.success('Үйлчилгээ устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Холбоо барих"
        subtitle="Оршин суугчдын аппын «Холбоо барих» хэсэгт харагдах үйлчилгээнүүд."
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Үйлчилгээ нэмэх</Button>}
      />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BookUser className="w-5 h-5" />}
          title="Үйлчилгээ бүртгэгдээгүй байна. Жижүүр, дулаан, цахилгаан шатны засвар зэрэг дугааруудаа нэмнэ үү."
          action={<Button variant="secondary" size="sm" onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Үйлчилгээ нэмэх</Button>}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Үйлчилгээнүүд">
          {items.map(item => {
            const cat = CATEGORY[item.category] || CATEGORY.other
            const Icon = cat.icon
            return (
              <li key={item._id} className="bg-surface border border-line rounded-card shadow-card p-4 flex flex-col">
                <div className="flex items-start gap-3">
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cat.tint}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink leading-snug">{item.name}</p>
                    <p className="text-xs text-ink-muted">{cat.label}</p>
                  </div>
                  <div className="flex shrink-0 -mr-1.5 -mt-1">
                    <IconAction label={`«${item.name}» засах`} onClick={() => startEdit(item)}><Pencil className="w-4 h-4" aria-hidden="true" /></IconAction>
                    <IconAction label={`«${item.name}» устгах`} danger disabled={busyId === item._id} onClick={() => removeItem(item)}><Trash2 className="w-4 h-4" aria-hidden="true" /></IconAction>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-sm">
                  {item.phone && <p className="flex items-center gap-2 font-semibold text-ink tabular-nums"><Phone className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />{item.phone}</p>}
                  {item.email && <p className="flex items-center gap-2 text-ink-secondary break-all"><Mail className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />{item.email}</p>}
                  {item.description && <p className="text-ink-muted">{item.description}</p>}
                  {!item.phone && !item.email && !item.description && <p className="text-ink-muted italic">Холбоо барих мэдээлэл оруулаагүй</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={dialogOpen} onClose={closeDialog} title={editingId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Нэр">
            <input className={fieldInputCls} placeholder="Жишээ: СӨХ-ийн жижүүр…" value={form.name} maxLength={120} autoComplete="off" onChange={set('name')} required />
          </FormField>
          <FormField label="Ангилал">
            <select className={fieldInputCls} value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Утасны дугаар">
              <input type="tel" inputMode="tel" autoComplete="off" className={fieldInputCls} placeholder="7011 2233…" value={form.phone} onChange={set('phone')} />
            </FormField>
            <FormField label="Имэйл">
              <input type="email" autoComplete="off" spellCheck={false} className={fieldInputCls} placeholder="info@example.mn…" value={form.email} onChange={set('email')} />
            </FormField>
          </div>
          <FormField label="Тайлбар (заавал биш)">
            <textarea className={fieldInputCls} rows={2} placeholder="Жишээ: Ажлын өдөр 09:00–18:00…" value={form.description} onChange={set('description')} />
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeDialog}>Болих</Button>
            <Button type="submit" loading={saving} disabled={!form.name.trim()}>{editingId ? 'Хадгалах' : 'Нэмэх'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
