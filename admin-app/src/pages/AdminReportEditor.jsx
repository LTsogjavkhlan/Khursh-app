import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import IconAction from '../components/ui/IconAction'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import ReportPreview from '../components/reports/ReportPreview'
import { formatMoney, formatDay } from '../utils/format'
import { SECTION_KINDS, SECTION_META, sectionMeta, computeTotals, fileSize } from '../utils/reports'
import { ChevronLeft, ChevronUp, ChevronDown, Trash2, Plus, X, Eye, Upload, FileText, Send, EyeOff, Save } from 'lucide-react'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 20
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,application/pdf'

let keySeq = 0
const newKey = () => `k${++keySeq}`
const emptyItem = () => ({ key: newKey(), label: '', amount: '', note: '' })
const emptySection = (kind) => ({ key: newKey(), kind, title: '', body: '', items: [] })
const NEW_REPORT = () => ({
  title: '', summary: '', periodStart: '', periodEnd: '',
  sections: [emptySection('work'), emptySection('income'), emptySection('expense')],
})

// Server report -> editable form state (amounts as editable strings)
const toForm = (r) => ({
  title: r.title || '',
  summary: r.summary || '',
  periodStart: r.periodStart ? String(r.periodStart).slice(0, 10) : '',
  periodEnd: r.periodEnd ? String(r.periodEnd).slice(0, 10) : '',
  sections: (r.sections || []).map(s => ({
    key: newKey(), kind: s.kind, title: s.title || '', body: s.body || '',
    items: (s.items || []).map(i => ({ key: newKey(), label: i.label || '', amount: typeof i.amount === 'number' ? String(i.amount) : '', note: i.note || '' })),
  })),
})

// "1 250 000" / "1,250,000₮" -> 1250000; '' -> null; NaN when not a number
const parseAmount = (v) => {
  const t = String(v).replace(/[\s,₮]/g, '')
  if (!t) return null
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

// Form state -> API body. Fully empty rows are dropped silently.
const toPayload = (f) => ({
  title: f.title.trim(),
  summary: f.summary.trim(),
  periodStart: f.periodStart || '',
  periodEnd: f.periodEnd || '',
  sections: f.sections.map(s => ({
    kind: s.kind,
    title: s.title.trim(),
    body: s.body.trim(),
    items: s.items
      .filter(i => i.label.trim() || String(i.amount).trim() || i.note.trim())
      .map(i => ({ label: i.label.trim(), amount: sectionMeta(s.kind).money ? parseAmount(i.amount) : null, note: i.note.trim() })),
  })),
})

const validate = (f) => {
  if (!f.title.trim()) return 'Тайлангийн гарчгийг оруулна уу'
  if (f.periodStart && f.periodEnd && f.periodStart > f.periodEnd) return 'Эхлэх огноо дуусах огнооноос өмнө байх ёстой'
  for (const s of f.sections) {
    for (const i of s.items) {
      const used = i.label.trim() || String(i.amount).trim() || i.note.trim()
      if (used && !i.label.trim()) return `«${s.title.trim() || sectionMeta(s.kind).label}» хэсгийн мөрийн нэрийг оруулна уу`
      if (sectionMeta(s.kind).money && Number.isNaN(parseAmount(i.amount))) return `«${i.label.trim() || 'Мөр'}»-ийн дүн буруу байна (зөвхөн тоо)`
    }
  }
  return null
}

function SectionEditor({ section, index, count, onChange, onMove, onRemove }) {
  const meta = sectionMeta(section.kind)
  const Icon = meta.icon
  const set = (patch) => onChange({ ...section, ...patch })
  const setItem = (key, patch) => set({ items: section.items.map(i => (i.key === key ? { ...i, ...patch } : i)) })
  const total = meta.money
    ? section.items.map(i => parseAmount(i.amount)).filter(a => typeof a === 'number' && !Number.isNaN(a)).reduce((a, b) => a + b, 0)
    : null
  const name = section.title.trim() || meta.label
  const titleId = `sec-${section.key}-title`

  return (
    <section aria-labelledby={titleId} className="bg-surface border border-line rounded-card shadow-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.tint}`}><Icon className="w-[18px] h-[18px]" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-[15px] font-semibold text-ink truncate">{name}</h3>
          <p className="text-xs text-ink-muted">{meta.hint}</p>
        </div>
        <div className="flex shrink-0 -mr-1.5">
          <IconAction label={`«${name}» хэсгийг дээш зөөх`} onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp className="w-4 h-4" aria-hidden="true" /></IconAction>
          <IconAction label={`«${name}» хэсгийг доош зөөх`} onClick={() => onMove(1)} disabled={index === count - 1}><ChevronDown className="w-4 h-4" aria-hidden="true" /></IconAction>
          <IconAction label={`«${name}» хэсгийг устгах`} danger onClick={onRemove}><Trash2 className="w-4 h-4" aria-hidden="true" /></IconAction>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px] gap-3">
        <FormField label="Хэсгийн гарчиг (заавал биш)">
          <input className={fieldInputCls} value={section.title} maxLength={120} placeholder={meta.label} autoComplete="off" onChange={e => set({ title: e.target.value })} />
        </FormField>
        <FormField label="Төрөл">
          <select className={fieldInputCls} value={section.kind} onChange={e => set({ kind: e.target.value })}>
            {SECTION_KINDS.map(k => <option key={k} value={k}>{SECTION_META[k].label}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Тайлбар">
        <textarea className={fieldInputCls} rows={3} maxLength={10000} value={section.body} placeholder="Энэ хэсгийн талаар дэлгэрэнгүй…" onChange={e => set({ body: e.target.value })} />
      </FormField>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-ink-secondary">{meta.money ? 'Мөрүүд (нэр, дүн)' : 'Жагсаалт'}</legend>
        {section.items.length > 0 && (
          <ul className="space-y-2">
            {section.items.map((it, i) => (
              <li key={it.key} className={`grid gap-2 items-start ${meta.money ? 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.4fr)_140px_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]'}`}>
                <input className={fieldInputCls} aria-label={`${i + 1}-р мөрийн нэр`} placeholder={meta.money ? 'Жишээ: Лифтний засвар…' : 'Жишээ: Хүүхдийн талбай шинэчилсэн…'} value={it.label} maxLength={200} autoComplete="off" onChange={e => setItem(it.key, { label: e.target.value })} />
                {meta.money && (
                  <input className={`${fieldInputCls} text-right tabular-nums order-3 sm:order-none col-span-1`} aria-label={`${i + 1}-р мөрийн дүн (₮)`} inputMode="decimal" placeholder="0₮" value={it.amount} autoComplete="off" onChange={e => setItem(it.key, { amount: e.target.value })} />
                )}
                <input className={`${fieldInputCls} order-4 sm:order-none ${meta.money ? '' : 'col-span-1'}`} aria-label={`${i + 1}-р мөрийн тэмдэглэл`} placeholder="Тэмдэглэл (заавал биш)" value={it.note} maxLength={500} autoComplete="off" onChange={e => setItem(it.key, { note: e.target.value })} />
                <div className="order-2 sm:order-none">
                  <IconAction label={`${i + 1}-р мөрийг хасах`} danger onClick={() => set({ items: section.items.filter(x => x.key !== it.key) })}><X className="w-4 h-4" aria-hidden="true" /></IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => set({ items: [...section.items, emptyItem()] })}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Мөр нэмэх
          </Button>
          {meta.money && section.items.length > 0 && (
            <p className="text-sm text-ink-secondary">Нийт: <span className="font-semibold text-ink tabular-nums">{formatMoney(total)}</span></p>
          )}
        </div>
      </fieldset>
    </section>
  )
}

export default function AdminReportEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)
  // Set when we navigate /new -> /:id ourselves, so we don't refetch and reset
  const justCreatedRef = useRef(null)

  const [form, setForm] = useState(NEW_REPORT)
  const [saved, setSaved] = useState(null)          // last server copy
  const [savedPayload, setSavedPayload] = useState(JSON.stringify(toPayload(NEW_REPORT())))
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState(null)
  const [busy, setBusy] = useState(null)            // 'save' | 'publish' | 'unpublish' | 'delete' | 'upload'
  const [error, setError] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (isNew) return
    if (justCreatedRef.current === id) { justCreatedRef.current = null; return }
    let active = true
    setLoading(true)
    apiRequest(`/api/reports/admin/${id}`)
      .then(r => {
        if (!active) return
        const f = toForm(r)
        setForm(f); setSaved(r); setSavedPayload(JSON.stringify(toPayload(f)))
      })
      .catch(err => { if (active) setLoadError(err.status === 404 ? 'Тайлан олдсонгүй.' : err.message || 'Ачаалахад алдаа гарлаа.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isNew])

  const payload = useMemo(() => toPayload(form), [form])
  const dirty = JSON.stringify(payload) !== savedPayload
  const published = saved?.status === 'published'

  // Warn before leaving the tab with unsaved edits
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const setField = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError(null) }
  const updateSection = (key, next) => { setForm(f => ({ ...f, sections: f.sections.map(s => (s.key === key ? next : s)) })); setError(null) }
  const moveSection = (index, dir) => setForm(f => {
    const sections = [...f.sections]
    const j = index + dir
    if (j < 0 || j >= sections.length) return f
    ;[sections[index], sections[j]] = [sections[j], sections[index]]
    return { ...f, sections }
  })
  const removeSection = (s) => {
    const hasContent = s.body.trim() || s.items.some(i => i.label.trim())
    if (hasContent && !window.confirm(`«${s.title.trim() || sectionMeta(s.kind).label}» хэсгийг устгах уу?`)) return
    setForm(f => ({ ...f, sections: f.sections.filter(x => x.key !== s.key) }))
  }
  const addSection = (kind) => setForm(f => ({ ...f, sections: [...f.sections, { ...emptySection(kind), items: [emptyItem()] }] }))

  const applyServer = (r) => {
    setSaved(r)
    const f = toForm(r)
    setForm(f)
    setSavedPayload(JSON.stringify(toPayload(f)))
  }

  // Saves the form (create or update). Returns the saved report, or null.
  async function save({ quiet = false } = {}) {
    const problem = validate(form)
    if (problem) { setError(problem); return null }
    setError(null)
    const r = isNew && !saved
      ? await apiRequest('/api/reports', { method: 'POST', body: JSON.stringify(payload) })
      : await apiRequest(`/api/reports/${saved?._id || id}`, { method: 'PUT', body: JSON.stringify(payload) })
    applyServer(r)
    if (isNew) { justCreatedRef.current = r._id; navigate(`/reports/${r._id}`, { replace: true }) }
    if (!quiet) toast.success(published ? 'Өөрчлөлт хадгалагдлаа — оршин суугчдад шинэчлэгдсэн хувилбар харагдана' : 'Ноорог хадгалагдлаа')
    return r
  }

  const run = async (kind, fn) => {
    setBusy(kind)
    try { await fn() } catch (err) { setError(err.message || 'Алдаа гарлаа'); toast.error(err.message || 'Алдаа гарлаа') } finally { setBusy(null) }
  }

  const handleSave = () => run('save', () => save())

  const handlePublish = () => run('publish', async () => {
    const first = !saved?.firstPublishedAt
    if (!window.confirm(first
      ? 'Тайланг нийтлэх үү? Оршин суугчид аппаасаа харах бөгөөд тэдэнд мэдэгдэл очно.'
      : 'Тайланг дахин нийтлэх үү? Оршин суугчдад харагдана.')) return
    const r = dirty || !saved ? await save({ quiet: true }) : saved
    if (!r) return
    applyServer(await apiRequest(`/api/reports/${r._id}/publish`, { method: 'PUT' }))
    toast.success('Тайлан нийтлэгдлээ')
  })

  const handleUnpublish = () => run('unpublish', async () => {
    if (!window.confirm('Тайланг нийтлэлээс буулгах уу? Оршин суугчдад харагдахаа болино.')) return
    applyServer(await apiRequest(`/api/reports/${saved._id}/unpublish`, { method: 'PUT' }))
    toast.success('Нийтлэлээс буулгалаа — одоо ноорог')
  })

  const handleDelete = () => run('delete', async () => {
    if (!window.confirm(`«${saved.title}» тайланг бүр мөсөн устгах уу? Хавсралтууд мөн устна.`)) return
    await apiRequest(`/api/reports/${saved._id}`, { method: 'DELETE' })
    setSavedPayload(JSON.stringify(payload)) // nothing left to warn about
    toast.success('Тайлан устгагдлаа')
    navigate('/reports')
  })

  const handleFiles = (e) => run('upload', async () => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !saved) return
    const tooBig = files.find(f => f.size > MAX_FILE_BYTES)
    if (tooBig) throw new Error(`«${tooBig.name}» 10MB-аас том байна`)
    if ((saved.attachments?.length || 0) + files.length > MAX_ATTACHMENTS) throw new Error(`Нэг тайланд хамгийн ихдээ ${MAX_ATTACHMENTS} хавсралт`)
    // The upload endpoint takes 5 files per request
    let latest = saved
    for (let i = 0; i < files.length; i += 5) {
      const body = new FormData()
      files.slice(i, i + 5).forEach(f => body.append('files', f))
      latest = await apiRequest(`/api/reports/${saved._id}/attachments`, { method: 'POST', body })
    }
    // Keep unsaved text edits; only take the new attachment list
    setSaved(s => ({ ...s, attachments: latest.attachments }))
    toast.success(files.length > 1 ? `${files.length} файл нэмэгдлээ` : 'Файл нэмэгдлээ')
  })

  const removeAttachment = async (a) => {
    if (!window.confirm(`«${a.name || 'Хавсралт'}»-ыг устгах уу?`)) return
    setRemovingId(a._id)
    try {
      const r = await apiRequest(`/api/reports/${saved._id}/attachments/${a._id}`, { method: 'DELETE' })
      setSaved(s => ({ ...s, attachments: r.attachments }))
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа')
    } finally {
      setRemovingId(null)
    }
  }

  const goBack = () => {
    if (dirty && !window.confirm('Хадгалаагүй өөрчлөлт байна. Гарах уу?')) return
    navigate('/reports')
  }

  const previewData = useMemo(() => {
    const { sections, totals } = computeTotals(payload.sections.map(s => ({ ...s, items: s.items.map(i => ({ ...i, amount: Number.isNaN(i.amount) ? null : i.amount })) })))
    return { ...payload, sections, totals, attachments: saved?.attachments || [], publishedAt: saved?.publishedAt }
  }, [payload, saved])

  if (loading) return <div className="max-w-5xl space-y-4"><Skeleton.Line className="h-10 w-1/3" /><Skeleton.List rows={4} /></div>
  if (loadError) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link to="/reports" className={`inline-flex items-center gap-1 text-sm font-semibold text-brand-text ${FOCUS_RING}`}><ChevronLeft className="w-4 h-4" aria-hidden="true" /> Тайлангууд</Link>
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{loadError}</p>
      </div>
    )
  }

  const attachments = saved?.attachments || []
  const working = Boolean(busy)

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button type="button" onClick={goBack} className={`-ml-1 mb-2 inline-flex items-center gap-1 rounded-[6px] px-1 text-sm font-semibold text-brand-text hover:underline ${FOCUS_RING}`}>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Тайлангууд
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{isNew && !saved ? 'Шинэ тайлан' : (form.title.trim() || 'Гарчиггүй тайлан')}</h1>
            {published ? <Badge tone="green" dot>Нийтэлсэн</Badge> : <Badge tone="slate">Ноорог</Badge>}
            {dirty && <span className="text-xs font-medium text-warning-text" aria-live="polite">Хадгалаагүй өөрчлөлт</span>}
          </div>
          {saved && (
            <p className="mt-1 text-xs text-ink-muted">
              {published && saved.publishedAt ? `${formatDay(saved.publishedAt)}-нд нийтэлсэн · ` : ''}{formatDay(saved.updatedAt)}-нд засварласан
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}><Eye className="w-4 h-4" aria-hidden="true" /> Урьдчилан харах</Button>
          <Button variant="secondary" onClick={handleSave} loading={busy === 'save'} disabled={working || (!dirty && Boolean(saved))}>
            {busy !== 'save' && <Save className="w-4 h-4" aria-hidden="true" />} {published ? 'Хадгалах' : 'Ноорог хадгалах'}
          </Button>
          {published ? (
            <Button variant="danger" onClick={handleUnpublish} loading={busy === 'unpublish'} disabled={working}>
              {busy !== 'unpublish' && <EyeOff className="w-4 h-4" aria-hidden="true" />} Нийтлэлээс буулгах
            </Button>
          ) : (
            <Button onClick={handlePublish} loading={busy === 'publish'} disabled={working}>
              {busy !== 'publish' && <Send className="w-4 h-4" aria-hidden="true" />} Нийтлэх
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          <section aria-labelledby="basics-title" className="bg-surface border border-line rounded-card shadow-card p-5 space-y-4">
            <h2 id="basics-title" className="text-[15px] font-semibold text-ink">Ерөнхий мэдээлэл</h2>
            <FormField label="Гарчиг">
              <input className={fieldInputCls} value={form.title} maxLength={200} autoComplete="off" placeholder="Жишээ: 2026 оны 3-р улирлын тайлан…" onChange={setField('title')} required />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Тайлант хугацаа: эхлэх">
                <input type="date" className={fieldInputCls} value={form.periodStart} onChange={setField('periodStart')} />
              </FormField>
              <FormField label="Дуусах">
                <input type="date" className={fieldInputCls} value={form.periodEnd} min={form.periodStart || undefined} onChange={setField('periodEnd')} />
              </FormField>
            </div>
            <FormField label="Товч тайлбар — нүүр хуудсанд харагдана">
              <textarea className={fieldInputCls} rows={3} maxLength={1500} value={form.summary} placeholder="Энэ хугацаанд СӨХ юу хийснийг 1–2 өгүүлбэрээр…" onChange={setField('summary')} />
            </FormField>
            <p className="-mt-2 text-right text-xs text-ink-muted tabular-nums">{form.summary.length}/1500</p>
          </section>

          {form.sections.map((s, i) => (
            <SectionEditor
              key={s.key}
              section={s}
              index={i}
              count={form.sections.length}
              onChange={next => updateSection(s.key, next)}
              onMove={dir => moveSection(i, dir)}
              onRemove={() => removeSection(s)}
            />
          ))}

          <section aria-labelledby="add-section-title" className="rounded-card border border-dashed border-line-strong p-5">
            <h2 id="add-section-title" className="text-sm font-semibold text-ink">Хэсэг нэмэх</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Зөвхөн энэ хугацаанд хамаарах хэсгүүдийг нэмнэ. Хоосон хэсэг оршин суугчдад харагдахгүй.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTION_KINDS.map(k => {
                const Icon = SECTION_META[k].icon
                return (
                  <Button key={k} type="button" variant="secondary" size="sm" onClick={() => addSection(k)}>
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {SECTION_META[k].label}
                  </Button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-4 xl:sticky xl:top-24">
          <section aria-labelledby="att-title" className="bg-surface border border-line rounded-card shadow-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 id="att-title" className="text-[15px] font-semibold text-ink">Хавсралт</h2>
              <span className="text-xs text-ink-muted tabular-nums">{attachments.length}/{MAX_ATTACHMENTS}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">Баримт, зураг (JPEG, PNG, HEIC) эсвэл PDF. Тус бүр 10MB хүртэл.</p>
            {!saved ? (
              <div className="mt-3 rounded-control bg-surface-muted px-3.5 py-3 text-sm text-ink-secondary">
                Хавсралт нэмэхийн тулд эхлээд ноорог хадгална уу.
                <div className="mt-2"><Button size="sm" variant="secondary" onClick={handleSave} loading={busy === 'save'} disabled={working}>Ноорог хадгалах</Button></div>
              </div>
            ) : (
              <>
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {attachments.map(a => (
                      <li key={a._id} className="flex items-center gap-3 rounded-control border border-line py-1.5 pl-1.5 pr-1">
                        {a.kind === 'image'
                          ? <img src={a.thumbUrl || a.url} alt="" className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
                          : <span className="w-10 h-10 rounded-[8px] bg-danger-bg text-danger-text flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px]" aria-hidden="true" /></span>}
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className={`min-w-0 flex-1 rounded-[4px] ${FOCUS_RING}`}>
                          <span className="block truncate text-sm font-medium text-ink hover:underline">{a.name || (a.kind === 'image' ? 'Зураг' : 'Баримт')}</span>
                          <span className="block text-xs text-ink-muted">{a.kind === 'pdf' ? 'PDF' : 'Зураг'}{a.size ? ` · ${fileSize(a.size)}` : ''}</span>
                        </a>
                        <IconAction label={`«${a.name || 'Хавсралт'}»-ыг устгах`} danger disabled={removingId === a._id} onClick={() => removeAttachment(a)}><Trash2 className="w-4 h-4" aria-hidden="true" /></IconAction>
                      </li>
                    ))}
                  </ul>
                )}
                <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleFiles} />
                <Button className="mt-3 w-full" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={busy === 'upload'} disabled={working || attachments.length >= MAX_ATTACHMENTS}>
                  {busy !== 'upload' && <Upload className="w-4 h-4" aria-hidden="true" />} {busy === 'upload' ? 'Хуулж байна…' : 'Файл нэмэх'}
                </Button>
              </>
            )}
          </section>

          <section aria-labelledby="status-title" className="bg-surface border border-line rounded-card shadow-card p-5 text-sm">
            <h2 id="status-title" className="text-[15px] font-semibold text-ink">Төлөв</h2>
            <p className="mt-1 text-ink-secondary">
              {published
                ? 'Нийтэлсэн — оршин суугчид нүүр хуудас болон «Тайлан» цэснээс харж байна. Засвар хийж хадгалбал шууд шинэчлэгдэнэ.'
                : 'Ноорог — зөвхөн админууд харна. «Нийтлэх» дарахад оршин суугчдад харагдаж, мэдэгдэл очно.'}
            </p>
            {saved && (
              <Button variant="dangerGhost" size="sm" className="mt-3 -ml-2" onClick={handleDelete} loading={busy === 'delete'} disabled={working}>
                {busy !== 'delete' && <Trash2 className="w-4 h-4" aria-hidden="true" />} Тайланг устгах
              </Button>
            )}
          </section>
        </aside>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Урьдчилан харах — оршин суугчдад ингэж харагдана" maxWidth="max-w-xl">
        <ReportPreview report={previewData} />
      </Modal>
    </div>
  )
}
