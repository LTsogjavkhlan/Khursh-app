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
import FilterTabs from '../components/ui/FilterTabs'
import SearchInput from '../components/ui/SearchInput'
import { addressLine, formatMoney, formatMonthLong, formatDay } from '../utils/format'
import { Users, UserPlus, ShieldCheck, Check, X, UserSearch } from 'lucide-react'

const MEMBERSHIP_META = {
  none:     { label: 'Гишүүнчлэлгүй', tone: 'slate' },
  pending:  { label: 'Хүлээгдэж буй', tone: 'yellow' },
  active:   { label: 'Идэвхтэй',      tone: 'green' },
  rejected: { label: 'Татгалзсан',    tone: 'red' },
}

const PAYMENT_STATUS_META = {
  pending:    { label: 'Хүлээгдэж буй', tone: 'yellow' },
  processing: { label: 'Боловсруулж байна', tone: 'blue' },
  completed:  { label: 'Төлөгдсөн', tone: 'green' },
  failed:     { label: 'Амжилтгүй', tone: 'red' },
}

const PAGE_SIZE = 20

const fullName = (u) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || 'Нэргүй'
const apartmentOf = (u) => [u?.building, u?.apartmentNumber].filter(Boolean).join('-')
const initialsOf = (u) => ((u?.firstName?.[0] || '') + (u?.lastName?.[0] || '')).toUpperCase() || (u?.email?.[0] || '?').toUpperCase()

function Avatar({ user, large = false }) {
  const admin = user?.role === 'admin'
  return (
    <span
      aria-hidden="true"
      className={`${large ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs'} rounded-full flex items-center justify-center font-bold shrink-0 ${
        admin ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand-text'
      }`}
    >
      {initialsOf(user)}
    </span>
  )
}

function RoleBadge({ role }) {
  return role === 'admin'
    ? <Badge tone="blue">Админ</Badge>
    : <Badge tone="slate">Оршин суугч</Badge>
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line last:border-b-0">
      <span className="text-xs font-medium text-ink-muted shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{value || '—'}</span>
    </div>
  )
}

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiRequest(`/api/admin/users/${userId}`)
      .then(res => { if (!cancelled) setData(res) })
      .catch(err => { if (!cancelled) setError(err.message || 'Мэдээлэл ачаалахад алдаа гарлаа.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  const user = data?.user
  const membership = user ? (MEMBERSHIP_META[user.membershipStatus] || MEMBERSHIP_META.none) : null

  return (
    <Modal open onClose={onClose} title="Хэрэглэгчийн мэдээлэл">
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton.Line className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton.Line className="h-4 w-1/2" />
              <Skeleton.Line className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton.Line className="h-3 w-full" />
          <Skeleton.Line className="h-3 w-full" />
          <Skeleton.Line className="h-3 w-2/3" />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>
      ) : !user ? null : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar user={user} large />
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink truncate">{fullName(user)}</p>
              <p className="text-sm text-ink-muted truncate">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <RoleBadge role={user.role} />
                {membership && <Badge tone={membership.tone}>{membership.label}</Badge>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Холбоо барих</h3>
            <InfoRow label="Утас" value={user.phone} />
            <InfoRow label="СӨХ" value={user.hoaName} />
            <InfoRow label="Хаяг" value={addressLine(user)} />
          </div>

          {(user.utilityElectricity || user.utilityWaterHeat) && (
            <div>
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Тоолуурын дугаар</h3>
              <InfoRow label="Цахилгаан" value={user.utilityElectricity} />
              <InfoRow label="Ус, дулаан" value={user.utilityWaterHeat} />
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Тойм</h3>
            <InfoRow label="Санал, гомдол" value={`${data.feedbackCount ?? 0}`} />
            <InfoRow label="Бүртгүүлсэн" value={user.createdAt ? `${new Date(user.createdAt).getFullYear()} оны ${formatDay(user.createdAt)}` : null} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Сүүлийн төлбөрүүд</h3>
            {!data.payments || data.payments.length === 0 ? (
              <p className="text-sm text-ink-muted">Төлбөрийн түүх алга.</p>
            ) : (
              <ul className="space-y-2">
                {data.payments.map(p => {
                  const meta = PAYMENT_STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                  return (
                    <li key={p._id} className="flex items-center justify-between gap-3 text-sm bg-surface-muted rounded-lg px-3 py-2">
                      <span className="text-ink-secondary">
                        {p.month ? formatMonthLong(p.month) : '—'} · <span className="font-semibold text-ink tabular-nums">{formatMoney(p.amount)}</span>
                      </span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function AdminUsers() {
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [detailUserId, setDetailUserId] = useState(null)

  async function load() {
    try {
      setError(null)
      const [allUsers, pendingUsers] = await Promise.all([
        apiRequest('/api/admin/users'),
        apiRequest('/api/admin/memberships/pending'),
      ])
      setUsers(Array.isArray(allUsers) ? allUsers : [])
      setPending(Array.isArray(pendingUsers) ? pendingUsers : [])
    } catch (err) {
      setError(err.message || 'Хэрэглэгчдийг ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setVisible(PAGE_SIZE) }, [tab, query])

  async function act(id, action) {
    try {
      setBusyId(id)
      await apiRequest(`/api/admin/memberships/${id}/${action}`, { method: 'PUT' })
      toast.success(action === 'accept' ? 'Хүсэлтийг зөвшөөрлөө' : 'Хүсэлтийг татгалзлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Үйлдэл амжилтгүй боллоо.')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleRole(user) {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(`${fullName(user)}-г ${nextRole === 'admin' ? 'админ' : 'энгийн хэрэглэгч'} болгох уу?`)) return
    try {
      setBusyId(user._id)
      await apiRequest(`/api/admin/users/${user._id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole }),
      })
      toast.success('Эрх шинэчлэгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'Эрх өөрчлөхөд алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length

  const list = useMemo(() => {
    const base = tab === 'pending' ? pending : tab === 'admins' ? users.filter(u => u.role === 'admin') : users
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(u =>
      [fullName(u), u.email, u.phone, apartmentOf(u), addressLine(u)].some(v => v && String(v).toLowerCase().includes(q)))
  }, [tab, users, pending, query])

  const shown = list.slice(0, visible)
  const isPending = tab === 'pending'

  const nameCell = (u) => (
    <button type="button" onClick={() => setDetailUserId(u._id)} className={`flex items-center gap-3 min-w-0 text-left rounded-[6px] group ${FOCUS_RING}`}>
      <Avatar user={u} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink truncate group-hover:underline underline-offset-2">{fullName(u)}</span>
        <span className="block text-xs text-ink-muted truncate">{u.email}</span>
      </span>
    </button>
  )

  const actions = (u) => isPending ? (
    <div className="flex gap-2 justify-end shrink-0">
      <Button variant="success" size="sm" disabled={busyId === u._id} onClick={() => act(u._id, 'accept')}>
        <Check className="w-4 h-4" aria-hidden="true" /> Зөвшөөрөх
      </Button>
      <Button variant="secondary" size="sm" disabled={busyId === u._id} onClick={() => act(u._id, 'reject')} aria-label={`${fullName(u)} хүсэлтийг татгалзах`}>
        <X className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">Татгалзах</span>
      </Button>
    </div>
  ) : (
    <div className="flex justify-end shrink-0">
      <Button variant="ghost" size="sm" className="whitespace-nowrap" disabled={busyId === u._id} onClick={() => toggleRole(u)}>
        {u.role === 'admin' ? 'Эрх хасах' : 'Админ болгох'}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Хэрэглэгчид" subtitle="СӨХ-ийн оршин суугчид болон гишүүнчлэлийн хүсэлт." />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <>
          <div className="hidden sm:grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton.Line key={i} className="h-[104px] rounded-card" />)}
          </div>
          <Skeleton.List rows={6} />
        </>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-3 gap-4">
            <StatCard label="Оршин суугч" value={users.length} icon={<Users className="w-[18px] h-[18px]" />} hint="Бүртгэлтэй хэрэглэгч" />
            <StatCard label="Хүлээгдэж буй хүсэлт" value={pending.length} icon={<UserPlus className="w-[18px] h-[18px]" />} hint={pending.length ? 'Шийдвэр хүлээж байна' : 'Шинэ хүсэлт алга'} />
            <StatCard label="Админ" value={adminCount} icon={<ShieldCheck className="w-[18px] h-[18px]" />} hint="Удирдах эрхтэй" />
          </div>

          <section className="bg-surface border border-line rounded-card shadow-card min-w-0" aria-label="Хэрэглэгчийн жагсаалт">
            <div className="p-4 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
              <FilterTabs
                label="Хэрэглэгч шүүх"
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'all', label: 'Бүгд', count: users.length },
                  { id: 'pending', label: 'Хүсэлт', count: pending.length },
                  { id: 'admins', label: 'Админ', count: adminCount },
                ]}
              />
              <SearchInput className="lg:ml-auto lg:w-72" label="Хэрэглэгч хайх" placeholder="Нэр, имэйл, утас эсвэл тоот…" value={query} onChange={setQuery} />
            </div>

            {list.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<UserSearch className="w-5 h-5" />}
                  title={query ? 'Хайлтад тохирох хэрэглэгч олдсонгүй.' : isPending ? 'Хүлээгдэж буй хүсэлт алга.' : 'Хэрэглэгч алга.'}
                />
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted border-b border-line">
                        <th scope="col" className="px-5 py-3 font-medium">Хэрэглэгч</th>
                        <th scope="col" className="px-3 py-3 font-medium">Тоот</th>
                        <th scope="col" className="px-3 py-3 font-medium">{isPending ? 'Хүссэн хаяг' : 'Хаяг'}</th>
                        <th scope="col" className="px-3 py-3 font-medium">{isPending ? 'Утас' : 'Эрх'}</th>
                        <th scope="col" className="px-5 py-3 font-medium text-right"><span className="sr-only">Үйлдэл</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {shown.map(u => (
                        <tr key={u._id} className="hover:bg-surface-muted/60 transition-colors">
                          <td className="px-5 py-3 max-w-[280px]">{nameCell(u)}</td>
                          <td className="px-3 py-3 font-semibold text-ink tabular-nums whitespace-nowrap">{apartmentOf(u) || '—'}</td>
                          <td className="px-3 py-3 text-ink-secondary">{addressLine(u)}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{isPending ? <span className="text-ink-secondary tabular-nums">{u.phone || '—'}</span> : <RoleBadge role={u.role} />}</td>
                          <td className="px-5 py-3">{actions(u)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="md:hidden divide-y divide-line">
                  {shown.map(u => (
                    <li key={u._id} className="px-4 py-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        {nameCell(u)}
                        {!isPending && <RoleBadge role={u.role} />}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-ink-muted min-w-0 truncate">{addressLine(u)}</span>
                        {actions(u)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="px-5 py-3 border-t border-line flex items-center justify-between gap-3 text-xs text-ink-muted">
                  <span className="tabular-nums">{list.length}-аас {shown.length}-г харуулж байна</span>
                  {shown.length < list.length && (
                    <Button variant="secondary" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>Цааш үзэх</Button>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {detailUserId && (
        <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  )
}
