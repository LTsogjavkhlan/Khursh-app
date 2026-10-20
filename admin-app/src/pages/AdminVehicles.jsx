import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'

function addressOf(user) {
  return [
    user?.building ? `${user.building}-р байр` : null,
    user?.entrance ? `${user.entrance}-р орц` : null,
    user?.floor ? `${user.floor}-р давхар` : null,
    user?.apartmentNumber ? `${user.apartmentNumber}-р тоот` : null,
  ].filter(Boolean).join(', ') || '—'
}

const thCls = 'text-left text-xs font-semibold text-ink-muted uppercase tracking-wide px-4 py-3'
const tdCls = 'px-4 py-3 align-middle'

export default function AdminVehicles() {
  const toast = useToast()
  const [tab, setTab] = useState('vehicles')
  const [vehicles, setVehicles] = useState([])
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [v, g] = await Promise.all([
        apiRequest('/api/admin/vehicles'),
        apiRequest('/api/admin/guest-passes'),
      ])
      setVehicles(Array.isArray(v) ? v : [])
      setPasses(Array.isArray(g) ? g : [])
    } catch (err) {
      setError(err.message || 'Ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function removeVehicle(id) {
    if (!window.confirm('Энэ машиныг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/admin/vehicles/${id}`, { method: 'DELETE' })
      toast.success('Машин устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  async function removePass(id) {
    if (!window.confirm('Энэ зочны зөвшөөрлийг устгах уу?')) return
    try {
      setBusyId(id)
      await apiRequest(`/api/admin/guest-passes/${id}`, { method: 'DELETE' })
      toast.success('Зөвшөөрөл устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Машин" subtitle="Бүртгэлтэй машин болон зочны зөвшөөрөл." />

      <div className="flex gap-2">
        <button onClick={() => setTab('vehicles')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 ${tab === 'vehicles' ? 'bg-brand text-white border-brand' : 'border-line text-ink-secondary hover:bg-surface-muted'}`}>
          Машин ({vehicles.length})
        </button>
        <button onClick={() => setTab('passes')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 ${tab === 'passes' ? 'bg-brand text-white border-brand' : 'border-line text-ink-secondary hover:bg-surface-muted'}`}>
          Зочны зөвшөөрөл ({passes.length})
        </button>
      </div>

      {error && <div className="rounded-xl bg-danger-bg border border-danger-bg px-4 py-3 text-sm text-danger-text">{error}</div>}

      {loading ? (
        <Skeleton.List rows={4} />
      ) : tab === 'vehicles' ? (
        vehicles.length === 0 ? (
          <EmptyState title="Бүртгэлтэй машин алга." />
        ) : (
          <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={thCls}>Улсын дугаар</th>
                  <th className={thCls}>Марк</th>
                  <th className={thCls}>Эзэмшигч</th>
                  <th className={`${thCls} text-right`}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id} className="border-b border-line last:border-b-0 hover:bg-surface-muted transition-colors duration-150">
                    <td className={tdCls}>
                      <span className="text-sm font-semibold text-ink">{v.plate}</span>
                      {v.isPrimary && <span className="text-[10px] text-brand-text font-medium ml-1.5">үндсэн</span>}
                    </td>
                    <td className={`${tdCls} text-sm text-ink-secondary`}>{v.model} {v.color ? `· ${v.color}` : ''}</td>
                    <td className={tdCls}>
                      <p className="text-sm text-ink-secondary">{v.user?.firstName} {v.user?.lastName}</p>
                      <p className="text-xs text-ink-muted">{addressOf(v.user)}</p>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <Button variant="danger" size="sm" disabled={busyId === v._id} onClick={() => removeVehicle(v._id)}>
                        Устгах
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : passes.length === 0 ? (
        <EmptyState title="Идэвхтэй зочны зөвшөөрөл алга." />
      ) : (
        <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={thCls}>Улсын дугаар</th>
                <th className={thCls}>Дуусах</th>
                <th className={thCls}>Эзэмшигч</th>
                <th className={`${thCls} text-right`}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {passes.map(p => (
                <tr key={p._id} className="border-b border-line last:border-b-0 hover:bg-surface-muted transition-colors duration-150">
                  <td className={`${tdCls} text-sm font-semibold text-ink`}>{p.plate}</td>
                  <td className={`${tdCls} text-sm text-ink-secondary whitespace-nowrap`}>{p.expiresAt ? new Date(p.expiresAt).toLocaleString('mn-MN') : '—'}</td>
                  <td className={tdCls}>
                    <p className="text-sm text-ink-secondary">{p.user?.firstName} {p.user?.lastName}</p>
                    <p className="text-xs text-ink-muted">{addressOf(p.user)}</p>
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <Button variant="danger" size="sm" disabled={busyId === p._id} onClick={() => removePass(p._id)}>
                      Устгах
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
