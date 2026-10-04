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

const CATEGORIES = [
  { value: 'hoa', label: 'СӨХ' },
  { value: 'heating', label: 'Дулаан' },
  { value: 'electricity', label: 'Цахилгаан' },
  { value: 'water', label: 'Ус' },
  { value: 'plumbing', label: 'Сантехник' },
  { value: 'elevator', label: 'Цахилгаан шат' },
  { value: 'security', label: 'Хамгаалалт' },
  { value: 'internet', label: 'Интернет' },
  { value: 'other', label: 'Бусад' },
]
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

const emptyForm = { name: '', category: 'other', phone: '', email: '', description: '', order: 0 }

export default function AdminContact() {
  const toast = useToast()
  const [items, setItems] = useState([])
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
      const data = await apiRequest('/api/contacts')
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
  }

  function cancelEdit() {
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
      cancelEdit()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(id) {
    if (!window.confirm('Энэ үйлчилгээг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/contacts/${id}`, { method: 'DELETE' })
      toast.success('Үйлчилгээ устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Холбоо барих" subtitle="Оршин суугчдад харагдах үйлчилгээний холбоо барих мэдээлэл." />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{editingId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Нэр">
            <input className={fieldInputCls} placeholder="Нэр" value={form.name} maxLength={120}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <FormField label="Ангилал">
            <select className={fieldInputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Утасны дугаар">
            <input className={fieldInputCls} placeholder="Утасны дугаар" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Имэйл">
            <input className={fieldInputCls} placeholder="Имэйл" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Тайлбар">
          <textarea className={fieldInputCls} rows={2} placeholder="Тайлбар" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={saving} disabled={!form.name.trim()} className="flex-1">
            {editingId ? 'Хадгалах' : 'Нэмэх'}
          </Button>
          {editingId && <Button type="button" variant="secondary" onClick={cancelEdit}>Цуцлах</Button>}
        </div>
      </form>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : items.length === 0 ? (
        <EmptyState title="Үйлчилгээ алга." />
      ) : (
        <ul className="space-y-3">
          {items.map(item => (
            <Card key={item._id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <Badge>{CATEGORY_LABEL[item.category] || item.category}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.phone} {item.email ? `· ${item.email}` : ''}</p>
                {item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => startEdit(item)}>Засах</Button>
                <Button variant="danger" size="sm" disabled={busyId === item._id} onClick={() => removeItem(item._id)}>Устгах</Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
