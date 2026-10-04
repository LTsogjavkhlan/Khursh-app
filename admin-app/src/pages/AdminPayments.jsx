import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { addressLine } from '../utils/format'

const STATUS_META = {
  pending:    { label: 'Хүлээгдэж буй', tone: 'yellow' },
  processing: { label: 'Боловсруулж байна', tone: 'blue' },
  completed:  { label: 'Төлөгдсөн', tone: 'green' },
  failed:     { label: 'Амжилтгүй', tone: 'red' },
}

const thCls = 'text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3'
const tdCls = 'px-4 py-3 align-middle'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-medium text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800 text-right">{value ?? '—'}</span>
    </div>
  )
}

function ResidentPaymentsModal({ user, payments, onClose }) {
  const history = payments.filter(p => p.user?._id === user._id)
  const paidTotal = history
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Modal open onClose={onClose} title="Оршин суугчийн төлбөр">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
            {user.firstName?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <div>
          <InfoRow label="Утас" value={user.phone} />
          <InfoRow label="Хаяг" value={addressLine(user)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{history.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Нийт нэхэмжлэл</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-600">{paidTotal.toLocaleString('mn-MN')}₮</p>
            <p className="text-xs text-slate-500 mt-0.5">Нийт төлсөн</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Төлбөрийн түүх</h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">Төлбөрийн түүх алга.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map(p => {
                const meta = STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                return (
                  <li key={p._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-slate-800 font-medium">{p.month || '—'}</p>
                      <p className="text-xs text-slate-500">{Number(p.amount).toLocaleString('mn-MN')}₮</p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
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
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalAmount: 0 })
  const [settings, setSettings] = useState({ monthlyFee: 50000, dueDay: 15, description: '' })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [genMonth, setGenMonth] = useState('')
  const [generating, setGenerating] = useState(false)
  const [detailUser, setDetailUser] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [paymentsRes, settingsRes] = await Promise.all([
        apiRequest('/api/payments/admin/all'),
        apiRequest('/api/payments/settings'),
      ])
      setPayments(Array.isArray(paymentsRes?.payments) ? paymentsRes.payments : [])
      setStats(paymentsRes?.stats || { total: 0, completed: 0, pending: 0, totalAmount: 0 })
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

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Төлбөр" subtitle="Сарын хураамжийн тохиргоо, нэхэмжлэл, төлбөрийн жагсаалт." />

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
          <Skeleton.List rows={4} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={saveSettings} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Сарын хураамжийн тохиргоо</h2>
              <FormField label="Сарын хураамж (₮)">
                <input type="number" min={0} className={fieldInputCls} value={settings.monthlyFee}
                  onChange={e => setSettings(s => ({ ...s, monthlyFee: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Төлбөр хийх өдөр (сарын)">
                <input type="number" min={1} max={31} className={fieldInputCls} value={settings.dueDay}
                  onChange={e => setSettings(s => ({ ...s, dueDay: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Тайлбар">
                <input className={fieldInputCls} value={settings.description}
                  onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} placeholder="СӨХ-ийн сарын хураамж" />
              </FormField>
              <Button type="submit" loading={savingSettings} className="w-full">Хадгалах</Button>
            </form>

            <form onSubmit={generateBills} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Сарын нэхэмжлэл үүсгэх</h2>
              <p className="text-xs text-slate-500">Тухайн сарын нэхэмжлэлгүй бүх оршин суугчид шинээр үүсгэнэ.</p>
              <FormField label="Сар (ЖЖЖЖ-СС)">
                <input type="month" className={fieldInputCls} value={genMonth} onChange={e => setGenMonth(e.target.value)} required />
              </FormField>
              <Button type="submit" variant="secondary" loading={generating} disabled={!genMonth} className="w-full">
                Нэхэмжлэл үүсгэх
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Нийт</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-slate-500 mt-0.5">Төлөгдсөн</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-slate-500 mt-0.5">Хүлээгдэж буй</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'processing', 'completed', 'failed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 ${filter === f ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {f === 'all' ? 'Бүгд' : STATUS_META[f]?.label || f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Төлбөр алга." />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Оршин суугч</th>
                    <th className={thCls}>Сар</th>
                    <th className={thCls}>Дүн</th>
                    <th className={thCls}>Төлөв</th>
                    <th className={`${thCls} text-right`}>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const meta = STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                    return (
                      <tr
                        key={p._id}
                        onClick={() => p.user && setDetailUser(p.user)}
                        className={`border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors duration-150 ${p.user ? 'cursor-pointer' : ''}`}
                      >
                        <td className={tdCls}>
                          <p className="text-sm font-medium text-slate-900">{p.user?.firstName} {p.user?.lastName}</p>
                          <p className="text-xs text-slate-500">{p.user?.building ? `${p.user.building}-${p.user.apartmentNumber || ''}` : '—'}</p>
                        </td>
                        <td className={`${tdCls} text-sm text-slate-600 whitespace-nowrap`}>{p.month || '—'}</td>
                        <td className={`${tdCls} text-sm text-slate-900 font-medium whitespace-nowrap`}>{Number(p.amount).toLocaleString('mn-MN')}₮</td>
                        <td className={tdCls}><Badge tone={meta.tone}>{meta.label}</Badge></td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex gap-2 justify-end">
                            {p.status !== 'completed' && (
                              <Button variant="success" size="sm" disabled={busyId === p._id} onClick={(e) => { e.stopPropagation(); markPaid(p._id) }}>
                                Төлсөн
                              </Button>
                            )}
                            <Button variant="danger" size="sm" disabled={busyId === p._id} onClick={(e) => { e.stopPropagation(); removePayment(p._id) }}>
                              Устгах
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {detailUser && (
        <ResidentPaymentsModal user={detailUser} payments={payments} onClose={() => setDetailUser(null)} />
      )}
    </div>
  )
}
