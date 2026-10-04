import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FormField, { fieldInputCls } from '../components/ui/FormField'

const emptyForm = { title: '', itemsText: '', order: 0 }

export default function AdminRules() {
  const toast = useToast()
  const [rules, setRules] = useState([])
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
      const data = await apiRequest('/api/rules')
      setRules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Дүрэм ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(rule) {
    setEditingId(rule._id)
    setForm({
      title: rule.title || '',
      itemsText: (rule.items || []).join('\n'),
      order: rule.order || 0,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title,
      items: form.itemsText.split('\n').map(s => s.trim()).filter(Boolean),
      order: form.order,
    }
    try {
      if (editingId) {
        await apiRequest(`/api/rules/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiRequest('/api/rules', { method: 'POST', body: JSON.stringify(payload) })
      }
      toast.success(editingId ? 'Дүрэм шинэчлэгдлээ' : 'Дүрэм нэмэгдлээ')
      cancelEdit()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRule(id) {
    if (!window.confirm('Энэ дүрмийг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/rules/${id}`, { method: 'DELETE' })
      toast.success('Дүрэм устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Дүрэм журам" subtitle="Оршин суугчдад харагдах СӨХ-ийн дүрмийн бүлгүүд." />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{editingId ? 'Дүрэм засах' : 'Шинэ дүрмийн бүлэг'}</h2>
        <FormField label="Гарчиг">
          <input className={fieldInputCls} placeholder="Гарчиг" value={form.title} maxLength={200}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </FormField>
        <FormField label="Дүрмийн зүйлүүд">
          <textarea className={fieldInputCls} rows={5} placeholder={'Дүрмийн зүйл тус бүрийг мөр мөрөөр бичнэ үү...'} value={form.itemsText}
            onChange={e => setForm(f => ({ ...f, itemsText: e.target.value }))} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" loading={saving} disabled={!form.title.trim()} className="flex-1">
            {editingId ? 'Хадгалах' : 'Нэмэх'}
          </Button>
          {editingId && <Button type="button" variant="secondary" onClick={cancelEdit}>Цуцлах</Button>}
        </div>
      </form>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : rules.length === 0 ? (
        <EmptyState title="Дүрэм алга." />
      ) : (
        <ul className="space-y-3">
          {rules.map(rule => (
            <Card key={rule._id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">{rule.title}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(rule)}>Засах</Button>
                  <Button variant="danger" size="sm" disabled={busyId === rule._id} onClick={() => removeRule(rule._id)}>Устгах</Button>
                </div>
              </div>
              {rule.items?.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {rule.items.map((it, i) => (
                    <li key={i} className="text-sm text-slate-600">{it}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
