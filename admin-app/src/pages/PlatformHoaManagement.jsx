import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Switch from '../components/ui/Switch'
import { fieldInputCls } from '../components/ui/FormField'

const STAT_LABELS = [
  ['residents', 'Оршин суугч'],
  ['apartments', 'Орон сууц'],
  ['pending', 'Хүлээгдэж буй'],
  ['admins', 'Админ'],
  ['vehicles', 'Машин'],
]

function HoaCard({ hoa, catalog, busyKey, onToggle }) {
  const enabledCount = catalog.filter(f => hoa.features[f.key]).length

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">{hoa.name}</h2>
          {hoa.address && <p className="text-xs text-slate-500 mt-0.5 truncate">{hoa.address}</p>}
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 tabular-nums">
          {enabledCount}/{catalog.length} идэвхтэй
        </span>
      </div>

      <dl className="grid grid-cols-5 gap-2">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="bg-slate-50 rounded-xl px-2 py-2 text-center min-w-0 flex flex-col-reverse">
            <dt className="text-[11px] text-slate-500 truncate">{label}</dt>
            <dd className="text-base font-semibold text-slate-900 tabular-nums">{hoa.stats[key]}</dd>
          </div>
        ))}
      </dl>

      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {catalog.map(f => {
          const id = `${hoa._id}-${f.key}`
          return (
            <li key={f.key} className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{f.label}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
              </div>
              <Switch
                checked={hoa.features[f.key]}
                disabled={busyKey === id}
                label={`${hoa.name}: ${f.label}`}
                onChange={(on) => onToggle(hoa, f, on)}
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// Platform admin: inspect every HOA and switch its optional features on/off.
export default function PlatformHoaManagement() {
  const toast = useToast()
  const [catalog, setCatalog] = useState([])
  const [hoas, setHoas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/api/hoas/overview')
      setCatalog(data?.catalog || [])
      setHoas(data?.hoas || [])
    } catch (err) {
      setError(err.message || 'СӨХ-ийн мэдээллийг ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setHoaFeature = (hoaId, key, on) =>
    setHoas(prev => prev.map(h => h._id === hoaId ? { ...h, features: { ...h.features, [key]: on } } : h))

  // Optimistic: flip the switch immediately, roll back if the save fails
  async function handleToggle(hoa, feature, on) {
    const id = `${hoa._id}-${feature.key}`
    setBusyKey(id)
    setHoaFeature(hoa._id, feature.key, on)
    try {
      await apiRequest(`/api/hoas/${hoa._id}/features`, {
        method: 'PUT',
        body: JSON.stringify({ [feature.key]: on }),
      })
      toast.success(`${hoa.name}: «${feature.label}» ${on ? 'идэвхжлээ' : 'унтарлаа'}`)
    } catch (err) {
      setHoaFeature(hoa._id, feature.key, !on)
      toast.error(err.message || 'Тохиргоо хадгалахад алдаа гарлаа.')
    } finally {
      setBusyKey(null)
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return hoas
    return hoas.filter(h => h.name.toLowerCase().includes(q) || (h.address || '').toLowerCase().includes(q))
  }, [hoas, query])

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="СӨХ удирдлага"
        subtitle="СӨХ бүрийн үзүүлэлтийг харж, тухайн СӨХ-д ямар үйлчилгээ байхыг тохируулна. Унтраасан үйлчилгээ оршин суугчийн аппад саарал харагдана."
      />

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          className={`${fieldInputCls} pl-10`}
          placeholder="СӨХ-ийн нэр эсвэл хаягаар хайх…"
          aria-label="СӨХ хайх"
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : hoas.length === 0 ? (
        <EmptyState title="Бүртгэлтэй СӨХ алга. «Байгууллагууд» хэсгээс шинэ СӨХ үүсгэнэ үү." />
      ) : visible.length === 0 ? (
        <EmptyState title={`«${query.trim()}» нэртэй СӨХ олдсонгүй.`} />
      ) : (
        <div className="space-y-4">
          {visible.map(h => (
            <HoaCard key={h._id} hoa={h} catalog={catalog} busyKey={busyKey} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  )
}
