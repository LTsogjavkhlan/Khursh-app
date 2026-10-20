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
import { Plus, Pencil, Trash2, ShieldCheck, ScrollText } from 'lucide-react'

const emptyForm = { title: '', itemsText: '', order: 0 }
const toItems = (text) => text.split('\n').map(s => s.trim()).filter(Boolean)

export default function AdminRules() {
  const toast = useToast()
  const [rules, setRules] = useState([])
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
      const data = await apiRequest('/api/rules')
      setRules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Дүрэм ачаалахад алдаа гарлаа.')
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

  function startEdit(rule) {
    setEditingId(rule._id)
    setForm({
      title: rule.title || '',
      itemsText: (rule.items || []).join('\n'),
      order: rule.order || 0,
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
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { title: form.title, items: toItems(form.itemsText), order: form.order }
    try {
      if (editingId) {
        await apiRequest(`/api/rules/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiRequest('/api/rules', { method: 'POST', body: JSON.stringify(payload) })
      }
      toast.success(editingId ? 'Дүрэм шинэчлэгдлээ' : 'Дүрэм нэмэгдлээ')
      closeDialog()
      await load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRule(rule) {
    if (!window.confirm(`«${rule.title}» бүлгийг устгах уу?`)) return
    try {
      setBusyId(rule._id)
      await apiRequest(`/api/rules/${rule._id}`, { method: 'DELETE' })
      toast.success('Дүрэм устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  const itemCount = toItems(form.itemsText).length

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Дүрэм журам"
        subtitle="Оршин суугчдын аппын «Дүрэм» хэсэгт харагдах дүрмийн бүлгүүд."
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Бүлэг нэмэх</Button>}
      />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-5 h-5" />}
          title="Дүрэм бүртгэгдээгүй байна. Жишээ нь «Ерөнхий дүрэм», «Автомашины дүрэм» гэх мэт бүлэг нэмнэ үү."
          action={<Button variant="secondary" size="sm" onClick={openCreate}><Plus className="w-4 h-4" aria-hidden="true" /> Бүлэг нэмэх</Button>}
        />
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <section key={rule._id} aria-labelledby={`rule-${rule._id}`} className="bg-surface border border-line rounded-card shadow-card p-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-brand-soft text-brand-text flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id={`rule-${rule._id}`} className="text-[15px] font-semibold text-ink">{rule.title}</h2>
                  <p className="text-xs text-ink-muted">{rule.items?.length || 0} дүрэм</p>
                </div>
                <div className="flex shrink-0 -mr-1.5">
                  <IconAction label={`«${rule.title}» засах`} onClick={() => startEdit(rule)}><Pencil className="w-4 h-4" aria-hidden="true" /></IconAction>
                  <IconAction label={`«${rule.title}» устгах`} danger disabled={busyId === rule._id} onClick={() => removeRule(rule)}><Trash2 className="w-4 h-4" aria-hidden="true" /></IconAction>
                </div>
              </div>
              {rule.items?.length > 0 && (
                <ol className="mt-4 space-y-2.5">
                  {rule.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-ink-secondary leading-relaxed">
                      <span aria-hidden="true" className="mt-px w-6 h-6 rounded-full bg-surface-muted text-xs font-semibold text-ink-secondary flex items-center justify-center shrink-0 tabular-nums">{i + 1}</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}

      <Modal open={dialogOpen} onClose={closeDialog} title={editingId ? 'Дүрмийн бүлэг засах' : 'Шинэ дүрмийн бүлэг'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Бүлгийн гарчиг">
            <input className={fieldInputCls} placeholder="Жишээ: Ерөнхий дүрэм…" value={form.title} maxLength={200} autoComplete="off"
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </FormField>
          <FormField label="Дүрмүүд — мөр бүрт нэг дүрэм">
            <textarea className={fieldInputCls} rows={7} placeholder={'22:00–07:00 цагт чимээ гаргахгүй байх\nНийтийн талбайг цэвэр байлгах…'} value={form.itemsText}
              onChange={e => setForm(f => ({ ...f, itemsText: e.target.value }))} />
          </FormField>
          <p className="text-xs text-ink-muted -mt-2" aria-live="polite">{itemCount} дүрэм</p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeDialog}>Болих</Button>
            <Button type="submit" loading={saving} disabled={!form.title.trim()}>{editingId ? 'Хадгалах' : 'Нэмэх'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
