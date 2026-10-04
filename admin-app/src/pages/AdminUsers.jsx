import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import { addressLine } from '../utils/format'

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

function Avatar({ user, large = false }) {
  return (
    <div className={`${large ? 'w-14 h-14' : 'w-9 h-9'} rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 flex-shrink-0 leading-tight text-center`}>
      {user?.building
        ? <>{user.building}<br />{user.apartmentNumber || '?'}</>
        : (user?.apartmentNumber || (user?.firstName?.[0] || '?'))}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-medium text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800 text-right">{value ?? '—'}</span>
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
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : !user ? null : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar user={user} large />
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={user.role === 'admin' ? 'blue' : 'slate'}>{user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}</Badge>
            {membership && <Badge tone={membership.tone}>{membership.label}</Badge>}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Холбоо барих</h3>
            <InfoRow label="Утас" value={user.phone} />
            <InfoRow label="СӨХ" value={user.hoaName} />
            <InfoRow label="Хаяг" value={addressLine(user)} />
          </div>

          {(user.utilityElectricity || user.utilityWaterHeat) && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Тоолуурын дугаар</h3>
              <InfoRow label="Цахилгаан" value={user.utilityElectricity} />
              <InfoRow label="Ус, дулаан" value={user.utilityWaterHeat} />
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Тойм</h3>
            <InfoRow label="Санал, гомдол" value={`${data.feedbackCount ?? 0}`} />
            <InfoRow label="Бүртгүүлсэн" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('mn-MN') : '—'} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Сүүлийн төлбөрүүд</h3>
            {!data.payments || data.payments.length === 0 ? (
              <p className="text-sm text-slate-400">Төлбөрийн түүх алга.</p>
            ) : (
              <ul className="space-y-2">
                {data.payments.map(p => {
                  const meta = PAYMENT_STATUS_META[p.status] || { label: p.status, tone: 'slate' }
                  return (
                    <li key={p._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-700">{p.month || '—'} · {Number(p.amount).toLocaleString('mn-MN')}₮</span>
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

const thCls = 'text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3'
const tdCls = 'px-4 py-3 align-middle'

export default function AdminUsers() {
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [detailUserId, setDetailUserId] = useState(null)

  async function load() {
    try {
      setLoading(true)
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
    if (!window.confirm(`${user.firstName} ${user.lastName}-г ${nextRole === 'admin' ? 'админ' : 'энгийн хэрэглэгч'} болгох уу?`)) return
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

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Хэрэглэгчид" subtitle="СӨХ-ийн оршин суугчид болон гишүүнчлэлийн хүсэлт." />

      <div className="flex gap-2">
        <button
          onClick={() => setTab('all')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 ${tab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          Бүх оршин суугч ({users.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 ${tab === 'pending' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          Хүлээгдэж буй хүсэлт ({pending.length})
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Skeleton.List rows={5} />
      ) : tab === 'all' ? (
        users.length === 0 ? (
          <EmptyState title="Оршин суугч алга." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>Хэрэглэгч</th>
                  <th className={thCls}>Хаяг</th>
                  <th className={thCls}>Эрх</th>
                  <th className={`${thCls} text-right`}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u._id}
                    onClick={() => setDetailUserId(u._id)}
                    className="border-b border-slate-50 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className={tdCls}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdCls} text-sm text-slate-600 whitespace-nowrap`}>{addressLine(u)}</td>
                    <td className={tdCls}>
                      <Badge tone={u.role === 'admin' ? 'blue' : 'slate'}>{u.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}</Badge>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === u._id}
                        onClick={(e) => { e.stopPropagation(); toggleRole(u) }}
                      >
                        {u.role === 'admin' ? 'Эрх хасах' : 'Админ болгох'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : pending.length === 0 ? (
        <EmptyState title="Хүлээгдэж буй хүсэлт алга." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Хэрэглэгч</th>
                <th className={thCls}>Хаяг</th>
                <th className={`${thCls} text-right`}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(u => (
                <tr
                  key={u._id}
                  onClick={() => setDetailUserId(u._id)}
                  className="border-b border-slate-50 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className={tdCls}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={u} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdCls} text-sm text-slate-600 whitespace-nowrap`}>{addressLine(u)}</td>
                  <td className={`${tdCls} text-right`}>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="success"
                        size="sm"
                        disabled={busyId === u._id}
                        onClick={(e) => { e.stopPropagation(); act(u._id, 'accept') }}
                      >
                        Зөвшөөрөх
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busyId === u._id}
                        onClick={(e) => { e.stopPropagation(); act(u._id, 'reject') }}
                      >
                        Татгалзах
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailUserId && (
        <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  )
}
