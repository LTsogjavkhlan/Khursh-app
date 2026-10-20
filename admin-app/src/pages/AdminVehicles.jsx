import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import FilterTabs from '../components/ui/FilterTabs'
import SearchInput from '../components/ui/SearchInput'
import { addressLine, formatDay } from '../utils/format'
import { Trash2, Car } from 'lucide-react'

const PAGE_SIZE = 20

const ownerName = (u) => u ? (`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email) : 'Устгагдсан хэрэглэгч'
const apartmentOf = (u) => [u?.building, u?.apartmentNumber].filter(Boolean).join('-')
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

// Plate rendered like a physical number plate
function Plate({ value }) {
  return (
    <span className="inline-flex items-center rounded-[6px] border-2 border-ink/80 bg-surface px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-ink">
      {value}
    </span>
  )
}

function Owner({ user }) {
  return (
    <span className="block min-w-0">
      <span className="block text-sm text-ink truncate">{ownerName(user)}</span>
      <span className="block text-xs text-ink-muted truncate">{user ? addressLine(user) : ''}</span>
    </span>
  )
}

function Expiry({ at }) {
  if (!at) return <span className="text-ink-muted">—</span>
  const d = new Date(at)
  const expired = d < new Date()
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-secondary tabular-nums whitespace-nowrap">{formatDay(d)}, {hhmm(d)}</span>
      {expired ? <Badge tone="slate">Дууссан</Badge> : <Badge tone="green" dot>Идэвхтэй</Badge>}
    </span>
  )
}

export default function AdminVehicles() {
  const toast = useToast()
  const [tab, setTab] = useState('vehicles')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [vehicles, setVehicles] = useState([])
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    try {
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
  useEffect(() => { setVisible(PAGE_SIZE) }, [tab, query])

  async function remove(item) {
    const isPass = tab === 'passes'
    if (!window.confirm(isPass ? `${item.plate} зочны зөвшөөрлийг устгах уу?` : `${item.plate} машиныг устгах уу?`)) return
    try {
      setBusyId(item._id)
      await apiRequest(`/api/admin/${isPass ? 'guest-passes' : 'vehicles'}/${item._id}`, { method: 'DELETE' })
      toast.success(isPass ? 'Зөвшөөрөл устгагдлаа' : 'Машин устгагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Устгахад алдаа гарлаа.')
    } finally {
      setBusyId(null)
    }
  }

  const isPasses = tab === 'passes'

  const list = useMemo(() => {
    const base = isPasses ? passes : vehicles
    const q = query.trim().toLowerCase().replace(/\s/g, '')
    if (!q) return base
    return base.filter(x =>
      [x.plate, x.model, x.color, ownerName(x.user), apartmentOf(x.user)]
        .some(v => v && String(v).toLowerCase().replace(/\s/g, '').includes(q)))
  }, [isPasses, passes, vehicles, query])

  const shown = list.slice(0, visible)

  const deleteBtn = (item) => (
    <button
      type="button"
      onClick={() => remove(item)}
      disabled={busyId === item._id}
      aria-label={`${item.plate} ${isPasses ? 'зочны зөвшөөрлийг' : 'машиныг'} устгах`}
      title="Устгах"
      className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger-text disabled:opacity-50 ${FOCUS_RING}`}
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
    </button>
  )

  const vehicleInfo = (v) => (
    <span className="text-sm text-ink-secondary">
      {[v.model, v.color].filter(Boolean).join(' · ') || '—'}
      {v.isPrimary && <Badge tone="blue" className="ml-2">Үндсэн</Badge>}
    </span>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Машин" subtitle="Бүртгэлтэй машин болон зочны зөвшөөрөл." />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={5} />
      ) : (
        <section className="bg-surface border border-line rounded-card shadow-card min-w-0" aria-label="Машины жагсаалт">
          <div className="p-4 border-b border-line flex flex-col lg:flex-row lg:items-center gap-3">
            <FilterTabs
              label="Төрлөөр шүүх"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'vehicles', label: 'Машин', count: vehicles.length },
                { id: 'passes', label: 'Зочны зөвшөөрөл', count: passes.length },
              ]}
            />
            <SearchInput className="lg:ml-auto lg:w-72" label="Машин хайх" placeholder="Дугаар, эзэмшигч эсвэл тоот…" value={query} onChange={setQuery} />
          </div>

          {list.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Car className="w-5 h-5" />}
                title={query ? 'Хайлтад тохирох машин олдсонгүй.' : isPasses ? 'Зочны зөвшөөрөл алга.' : 'Бүртгэлтэй машин алга.'}
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-muted border-b border-line">
                      <th scope="col" className="px-5 py-3 font-medium">Улсын дугаар</th>
                      <th scope="col" className="px-3 py-3 font-medium">{isPasses ? 'Дуусах хугацаа' : 'Марк, өнгө'}</th>
                      <th scope="col" className="px-3 py-3 font-medium">Тоот</th>
                      <th scope="col" className="px-3 py-3 font-medium">{isPasses ? 'Урьсан' : 'Эзэмшигч'}</th>
                      <th scope="col" className="px-5 py-3 font-medium text-right"><span className="sr-only">Үйлдэл</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shown.map(x => (
                      <tr key={x._id} className="hover:bg-surface-muted/60 transition-colors">
                        <td className="px-5 py-3"><Plate value={x.plate} /></td>
                        <td className="px-3 py-3">{isPasses ? <Expiry at={x.expiresAt} /> : vehicleInfo(x)}</td>
                        <td className="px-3 py-3 font-semibold text-ink tabular-nums whitespace-nowrap">{apartmentOf(x.user) || '—'}</td>
                        <td className="px-3 py-3 max-w-[280px]"><Owner user={x.user} /></td>
                        <td className="px-5 py-3"><div className="flex">{deleteBtn(x)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <ul className="md:hidden divide-y divide-line">
                {shown.map(x => (
                  <li key={x._id} className="px-4 py-3.5 space-y-2">
                    <div className="flex items-center gap-3">
                      <Plate value={x.plate} />
                      {apartmentOf(x.user) && <span className="text-xs font-semibold text-ink-secondary tabular-nums">{apartmentOf(x.user)}</span>}
                      {deleteBtn(x)}
                    </div>
                    <div>{isPasses ? <Expiry at={x.expiresAt} /> : vehicleInfo(x)}</div>
                    <Owner user={x.user} />
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
      )}
    </div>
  )
}
