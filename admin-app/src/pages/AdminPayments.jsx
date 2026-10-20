import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import FilterTabs from '../components/ui/FilterTabs'
import SearchInput from '../components/ui/SearchInput'
import { addressLine, formatMoney, formatMonthLong, formatMonthShort, formatDay } from '../utils/format'
import { Check, Trash2, Settings2, Receipt, CircleDollarSign, Wallet, CheckCircle2, Clock } from 'lucide-react'

const STATUS_META = {
  pending:    { label: 'Хүлээгдэж буй', tone: 'yellow' },
  processing: { label: 'Боловсруулж байна', tone: 'blue' },
  completed:  { label: 'Төлөгдсөн', tone: 'green' },
  failed:     { label: 'Амжилтгүй', tone: 'red' },
}
const STATUS_TABS = ['all', 'pending', 'processing', 'completed', 'failed']
const PAGE_SIZE = 20

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const apartmentOf = (u) => [u?.building, u?.apartmentNumber].filter(Boolean).join('-')

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line last:border-b-0">
      <span className="text-xs font-medium text-ink-muted flex-shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{value ?? '—'}</span>
    </div>
  )
}

function ResidentPaymentsModal({ user, payments, onClose }) {
  const history = payments.filter(p => p.user?._id === user._id)
  const paidTotal = history
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const owed = history
    .filter(p => p.status !== 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Modal open onClose={onClose} title="Оршин суугчийн төлбөр">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold text-brand-text flex-shrink-0">
            {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink truncate">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
          </div>
        </div>

        <div>
          <InfoRow label="Утас" value={user.phone} />
          <InfoRow label="Хаяг" value={addressLine(user)} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            [history.length, 'Нэхэмжлэл', 'text-ink'],
            [formatMoney(paidTotal), 'Төлсөн', 'text-success-text'],
            [formatMoney(owed), 'Үлдэгдэл', owed ? 'text-danger-text' : 'text-ink'],
          ].map(([value, label, cls]) => (
            <div key={label} className="bg-surface-muted rounded-control p-3 text-center min-w-0">
              <p className={`text-base font-semibold truncate ${cls}`}>{value}</p>
              <p className="text-xs text-ink-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Төлбөрийн түүх</h3>
          {history.length === 0 ? (
            <p className="text-sm text-ink-muted">Төлбөрийн түүх алга.</p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-control max-h-72 overflow-y-auto overscroll-contain">
              {history.map(p => {
                const meta = STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                return (
                  <li key={p._id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{p.month ? formatMonthLong(p.month) : '—'}</p>
                      <p className="text-xs text-ink-muted">
                        {formatMoney(p.amount)}{p.paidAt ? ` · ${formatDay(p.paidAt)}-нд төлсөн` : ''}
                      </p>
                    </div>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function AdminPayments() {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [settings, setSettings] = useState({ monthlyFee: 50000, dueDay: 15, description: '' })
  const [filter, setFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [genMonth, setGenMonth] = useState(thisMonth)
  const [generating, setGenerating] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [dialog, setDialog] = useState(null) // 'generate' | 'settings' | null

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [paymentsRes, settingsRes] = await Promise.all([
        apiRequest('/api/payments/admin/all'),
        apiRequest('/api/payments/settings'),
      ])
      setPayments(Array.isArray(paymentsRes?.payments) ? paymentsRes.payments : [])
      if (settingsRes) setSettings({
        monthlyFee: settingsRes.monthlyFee ?? 50000,
        dueDay: settingsRes.dueDay ?? 15,
        description: settingsRes.description || '',
      })
    } catch (err) {
      setError(err.message || 'Төлбөрийн мэдээлэл ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function saveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await apiRequest('/api/payments/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      toast.success('Тохиргоо хадгалагдлаа')
      setDialog(null)
    } catch (err) {
      toast.error(err.message || 'Тохиргоо хадгалахад алдаа гарлаа.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function generateBills(e) {
    e.preventDefault()
    if (!genMonth) return
    setGenerating(true)
    try {
      const res = await apiRequest('/api/payments/admin/generate-bills', {
        method: 'POST',
        body: JSON.stringify({ month: genMonth }),
      })
      toast.success(`${res.created} нэхэмжлэл үүсгэгдлээ (${res.skipped} алгассан)`)
      setDialog(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'Нэхэмжлэл үүсгэхэд алдаа гарлаа.')
    } finally {
      setGenerating(false)
    }
  }

  async function markPaid(id) {
    try {
      setBusyId(id)
      await apiRequest(`/api/payments/admin/${id}/mark-paid`, { method: 'PUT' })
      toast.success('Төлбөр төлөгдсөн гэж тэмдэглэгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'Алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  async function removePayment(id) {
    if (!window.confirm('Энэ төлбөрийг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/payments/admin/${id}`, { method: 'DELETE' })
      toast.success('Төлбөр устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  // Totals for the stat cards (all bills, independent of filters)
  const totals = useMemo(() => {
    const paid = payments.filter(p => p.status === 'completed')
    const unpaid = payments.filter(p => p.status !== 'completed')
    return {
      collected: paid.reduce((s, p) => s + (p.amount || 0), 0),
      outstanding: unpaid.reduce((s, p) => s + (p.amount || 0), 0),
      paidCount: paid.length,
      pendingCount: payments.filter(p => p.status === 'pending').length,
    }
  }, [payments])

  const months = useMemo(
    () => [...new Set(payments.map(p => p.month).filter(Boolean))].sort().reverse(),
    [payments]
  )

  // Month + search scope the status counts; status then picks the rows
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter(p => {
      if (monthFilter !== 'all' && p.month !== monthFilter) return false
      if (!q) return true
      const u = p.user || {}
      return `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${apartmentOf(u)}`.toLowerCase().includes(q)
    })
  }, [payments, monthFilter, query])

  const counts = useMemo(() => {
    const c = { all: scoped.length }
    for (const p of scoped) c[p.status] = (c[p.status] || 0) + 1
    return c
  }, [scoped])

  const filtered = filter === 'all' ? scoped : scoped.filter(p => p.status === filter)
  const shown = filtered.slice(0, visible)

  // Reset paging whenever the filters change
  useEffect(() => { setVisible(PAGE_SIZE) }, [filter, monthFilter, query])

  const actions = (p) => (
    <div className="flex gap-1.5 justify-end">
      {p.status !== 'completed' && (
        <Button variant="secondary" size="sm" disabled={busyId === p._id} onClick={() => markPaid(p._id)}>
          <Check className="w-3.5 h-3.5" aria-hidden="true" /> Төлсөн
        </Button>
      )}
      <button
        type="button"
        disabled={busyId === p._id}
        onClick={() => removePayment(p._id)}
        aria-label={`${p.user?.firstName || ''} ${p.month || ''} төлбөрийг устгах`}
        title="Устгах"
        className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-ink-muted hover:bg-danger-bg hover:text-danger-text transition-colors disabled:opacity-50 ${FOCUS_RING}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )

  const residentButton = (p) => p.user ? (
    <button
      type="button"
      onClick={() => setDetailUser(p.user)}
      className={`text-left rounded-[4px] group ${FOCUS_RING}`}
    >
      <span className="block text-sm font-medium text-ink group-hover:underline underline-offset-2">{p.user.firstName} {p.user.lastName}</span>
      <span className="block text-xs text-ink-muted">{apartmentOf(p.user) || '—'}</span>
    </button>
  ) : (
    <span className="text-sm text-ink-muted">Устгагдсан хэрэглэгч</span>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Төлбөр"
        subtitle="Сарын хураамж, нэхэмжлэл, төлбөрийн бүртгэл."
        action={
          <Button onClick={() => setDialog('generate')}>
            <Receipt className="w-4 h-4" aria-hidden="true" /> Нэхэмжлэл үүсгэх
          </Button>
        }
      />

      {error && <div role="alert" className="rounded-control bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</div>}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton.Card key={i} />)}
          </div>
          <Skeleton.List rows={5} />
        </div>
      ) : (
        <>
          {/* Fee settings summary */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface border border-line rounded-card px-5 py-3.5">
            <span className="text-sm text-ink-muted">Сарын хураамж <span className="font-semibold text-ink">{formatMoney(settings.monthlyFee)}</span></span>
            <span className="text-sm text-ink-muted">Төлөх өдөр <span className="font-semibold text-ink">сар бүрийн {settings.dueDay}</span></span>
            {settings.description && <span className="text-sm text-ink-muted truncate">«{settings.description}»</span>}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setDialog('settings')}>
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" /> Тохиргоо засах
            </Button>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Цугларсан" value={formatMoney(totals.collected)} icon={<CircleDollarSign className="w-[18px] h-[18px]" />} hint="Нийт төлөгдсөн дүн" />
            <StatCard label="Үлдэгдэл" value={formatMoney(totals.outstanding)} icon={<Wallet className="w-[18px] h-[18px]" />} hint="Төлөгдөөгүй нэхэмжлэл" />
            <StatCard label="Төлөгдсөн" value={totals.paidCount} icon={<CheckCircle2 className="w-[18px] h-[18px]" />} hint={`${payments.length} нэхэмжлэлээс`} />
            <StatCard label="Хүлээгдэж буй" value={totals.pendingCount} icon={<Clock className="w-[18px] h-[18px]" />} hint="Төлбөр хүлээж буй" />
          </div>

          <section className="bg-surface border border-line rounded-card shadow-card min-w-0" aria-label="Төлбөрийн жагсаалт">
            {/* Filters: one row above the list they scope */}
            <div className="p-4 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
              <FilterTabs
                label="Төлөвөөр шүүх"
                value={filter}
                onChange={setFilter}
                tabs={STATUS_TABS.map(f => ({ id: f, label: f === 'all' ? 'Бүгд' : STATUS_META[f]?.label || f, count: counts[f] || 0 }))}
              />
              <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
                <select
                  aria-label="Сараар шүүх"
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className={`${fieldInputCls.replace('w-full', '').replace('py-2.5', '')} h-9 py-1 w-full sm:w-48 shrink-0`}
                >
                  <option value="all">Бүх сар</option>
                  {months.map(m => <option key={m} value={m}>{formatMonthLong(m)}</option>)}
                </select>
                <SearchInput className="flex-1 sm:flex-none sm:w-60" label="Оршин суугч хайх" placeholder="Нэр эсвэл тоот…" value={query} onChange={setQuery} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Receipt className="w-5 h-5" />}
                title={payments.length === 0 ? 'Нэхэмжлэл үүсээгүй байна. «Нэхэмжлэл үүсгэх» товчоор сарын нэхэмжлэл үүсгэнэ үү.' : 'Шүүлтэд тохирох төлбөр олдсонгүй.'}
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted border-b border-line">
                        <th scope="col" className="px-5 py-3 font-medium">Оршин суугч</th>
                        <th scope="col" className="px-3 py-3 font-medium">Сар</th>
                        <th scope="col" className="px-3 py-3 font-medium text-right">Дүн</th>
                        <th scope="col" className="px-3 py-3 font-medium">Төлөв</th>
                        <th scope="col" className="px-3 py-3 font-medium">Төлсөн огноо</th>
                        <th scope="col" className="px-5 py-3 font-medium text-right"><span className="sr-only">Үйлдэл</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {shown.map(p => {
                        const meta = STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                        return (
                          <tr key={p._id} className="hover:bg-surface-muted/60 transition-colors">
                            <td className="px-5 py-3">{residentButton(p)}</td>
                            <td className="px-3 py-3 text-ink-secondary whitespace-nowrap">{p.month ? formatMonthLong(p.month) : '—'}</td>
                            <td className="px-3 py-3 text-right font-semibold text-ink tabular-nums whitespace-nowrap">{formatMoney(p.amount)}</td>
                            <td className="px-3 py-3"><Badge tone={meta.tone} dot>{meta.label}</Badge></td>
                            <td className="px-3 py-3 text-ink-secondary whitespace-nowrap">{p.paidAt ? formatDay(p.paidAt) : '—'}</td>
                            <td className="px-5 py-3">{actions(p)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="md:hidden divide-y divide-line">
                  {shown.map(p => {
                    const meta = STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                    return (
                      <li key={p._id} className="px-4 py-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          {residentButton(p)}
                          <span className="text-sm font-semibold text-ink tabular-nums whitespace-nowrap">{formatMoney(p.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 min-w-0">
                            <Badge tone={meta.tone} dot>{meta.label}</Badge>
                            <span className="text-xs text-ink-muted truncate">{p.month ? formatMonthShort(p.month) : ''}</span>
                          </span>
                          {actions(p)}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <div className="px-5 py-3 border-t border-line flex items-center justify-between gap-3 text-xs text-ink-muted">
                  <span className="tabular-nums">{filtered.length}-аас {shown.length}-г харуулж байна</span>
                  {shown.length < filtered.length && (
                    <Button variant="secondary" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>Цааш үзэх</Button>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}

      <Modal open={dialog === 'generate'} onClose={() => setDialog(null)} title="Сарын нэхэмжлэл үүсгэх">
        <form onSubmit={generateBills} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Сонгосон сард нэхэмжлэлгүй бүх эзэмшигчид {formatMoney(settings.monthlyFee)}-ийн нэхэмжлэл үүснэ. Аль хэдийн нэхэмжлэлтэй айл алгасагдана.
          </p>
          <FormField label="Сар">
            <input type="month" className={fieldInputCls} value={genMonth} onChange={e => setGenMonth(e.target.value)} required />
          </FormField>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setDialog(null)}>Болих</Button>
            <Button type="submit" loading={generating} disabled={!genMonth}>Нэхэмжлэл үүсгэх</Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog === 'settings'} onClose={() => setDialog(null)} title="Сарын хураамжийн тохиргоо">
        <form onSubmit={saveSettings} className="space-y-4">
          <FormField label="Сарын хураамж (₮)">
            <input type="number" min={0} inputMode="numeric" className={fieldInputCls} value={settings.monthlyFee}
              onChange={e => setSettings(s => ({ ...s, monthlyFee: Number(e.target.value) }))} />
          </FormField>
          <FormField label="Төлбөр хийх өдөр (сарын)">
            <input type="number" min={1} max={31} inputMode="numeric" className={fieldInputCls} value={settings.dueDay}
              onChange={e => setSettings(s => ({ ...s, dueDay: Number(e.target.value) }))} />
          </FormField>
          <FormField label="Тайлбар">
            <input className={fieldInputCls} value={settings.description} autoComplete="off"
              onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} placeholder="СӨХ-ийн сарын хураамж" />
          </FormField>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setDialog(null)}>Болих</Button>
            <Button type="submit" loading={savingSettings}>Хадгалах</Button>
          </div>
        </form>
      </Modal>

      {detailUser && (
        <ResidentPaymentsModal user={detailUser} payments={payments} onClose={() => setDetailUser(null)} />
      )}
    </div>
  )
}
