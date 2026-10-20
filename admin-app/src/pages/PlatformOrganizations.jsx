import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import SearchInput from '../components/ui/SearchInput'
import IconAction from '../components/ui/IconAction'
import { Plus, Building2, UserCog, UserMinus } from 'lucide-react'

function HoaAdminsModal({ hoa, onClose }) {
  const toast = useToast()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const [identifier, setIdentifier] = useState('')
  const [promoting, setPromoting] = useState(false)

  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const data = await apiRequest(`/api/hoas/${hoa._id}/admins`)
      setAdmins(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Админуудыг ачаалахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePromote(e) {
    e.preventDefault()
    if (!identifier.trim()) return
    setPromoting(true)
    try {
      await apiRequest(`/api/hoas/${hoa._id}/admins/promote`, {
        method: 'PUT',
        body: JSON.stringify({ identifier: identifier.trim() }),
      })
      toast.success('Хэрэглэгчийг админ болголоо')
      setIdentifier('')
      await load()
    } catch (err) {
      toast.error(err.message || 'Админ болгоход алдаа гарлаа')
    } finally {
      setPromoting(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await apiRequest(`/api/hoas/${hoa._id}/admins`, {
        method: 'POST',
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          phone: newPhone.trim(),
        }),
      })
      toast.success('Админ үүсгэгдлээ')
      setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewPassword(''); setNewPhone('')
      await load()
    } catch (err) {
      toast.error(err.message || 'Админ үүсгэхэд алдаа гарлаа')
    } finally {
      setCreating(false)
    }
  }

  async function handleDemote(admin) {
    if (!window.confirm(`${admin.firstName} ${admin.lastName}-г админ эрхээс хасах уу?`)) return
    setBusyId(admin._id)
    try {
      await apiRequest(`/api/hoas/${hoa._id}/admins/${admin._id}/demote`, { method: 'PUT' })
      toast.success('Админ эрх хасагдлаа')
      await load()
    } catch (err) {
      toast.error(err.message || 'Алдаа гарлаа')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal open onClose={onClose} title={`${hoa.name} — Админууд`} maxWidth="max-w-lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Одоогийн админууд</h3>
          {loading ? (
            <Skeleton.List rows={2} />
          ) : admins.length === 0 ? (
            <p className="text-sm text-ink-muted">Энэ СӨХ-д админ бүртгэгдээгүй байна.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map(a => (
                <li key={a._id} className="flex items-center justify-between gap-3 bg-surface-muted rounded-xl pl-3.5 pr-1.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-ink-muted truncate">{a.email}</p>
                  </div>
                  <IconAction label={`${a.firstName} ${a.lastName}-г админ эрхээс хасах`} danger disabled={busyId === a._id} onClick={() => handleDemote(a)}>
                    <UserMinus className="w-4 h-4" aria-hidden="true" />
                  </IconAction>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Бүртгэлтэй хэрэглэгчийг админ болгох</h3>
          <form onSubmit={handlePromote} className="flex gap-2">
            <input
              className={fieldInputCls}
              aria-label="Хэрэглэгчийн имэйл, утас эсвэл ID"
              autoComplete="off"
              spellCheck={false}
              placeholder="Имэйл, утас эсвэл ID…"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" loading={promoting} disabled={!identifier.trim()} className="flex-shrink-0">
              Болгох
            </Button>
          </form>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Шинэ админ бүртгэх</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Нэр">
                <input className={fieldInputCls} value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required />
              </FormField>
              <FormField label="Овог">
                <input className={fieldInputCls} value={newLastName} onChange={e => setNewLastName(e.target.value)} required />
              </FormField>
            </div>
            <FormField label="Имэйл">
              <input type="email" className={fieldInputCls} value={newEmail} onChange={e => setNewEmail(e.target.value)} autoComplete="off" spellCheck={false} required />
            </FormField>
            <FormField label="Түр нууц үг (6+ тэмдэгт)">
              <input type="password" className={fieldInputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
            </FormField>
            <FormField label="Утас (заавал биш)">
              <input className={fieldInputCls} value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </FormField>
            <Button type="submit" loading={creating} className="w-full">Админ үүсгэх</Button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

export default function PlatformOrganizations() {
  const toast = useToast()
  const [hoas, setHoas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [adminsHoa, setAdminsHoa] = useState(null)

  async function load() {
    try {
      setError(null)
      const data = await apiRequest('/api/hoas')
      setHoas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Байгууллагуудыг ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const canCreate = name.trim() && adminFirstName.trim() && adminLastName.trim() && adminEmail.trim() && adminPassword.length >= 6

  function resetCreate() {
    setName(''); setAddress('')
    setAdminFirstName(''); setAdminLastName(''); setAdminEmail(''); setAdminPassword(''); setAdminPhone('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!canCreate) return
    setCreating(true)
    try {
      await apiRequest('/api/hoas', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          adminFirstName: adminFirstName.trim(),
          adminLastName: adminLastName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword,
          adminPhone: adminPhone.trim(),
        }),
      })
      resetCreate()
      setCreateOpen(false)
      toast.success('СӨХ болон түүний админ амжилттай үүсгэгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'СӨХ үүсгэхэд алдаа гарлаа.')
    } finally {
      setCreating(false)
    }
  }

  const q = query.trim().toLowerCase()
  const shown = q ? hoas.filter(h => [h.name, h.address].some(v => v && v.toLowerCase().includes(q))) : hoas

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Байгууллагууд"
        subtitle="Системд бүртгэлтэй бүх СӨХ. Шинэ СӨХ үүсгэж, админ томилно."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" aria-hidden="true" /> СӨХ нэмэх</Button>}
      />

      {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">{error}</p>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : (
        <section className="bg-surface border border-line rounded-card shadow-card" aria-label="СӨХ-ийн жагсаалт">
          <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-ink-secondary"><span className="font-semibold text-ink tabular-nums">{hoas.length}</span> СӨХ бүртгэлтэй</p>
            <SearchInput className="sm:ml-auto sm:w-72" label="СӨХ хайх" placeholder="Нэр эсвэл хаяг…" value={query} onChange={setQuery} />
          </div>
          {shown.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<Building2 className="w-5 h-5" />} title={q ? 'Хайлтад тохирох СӨХ олдсонгүй.' : 'Бүртгэлтэй СӨХ алга.'} />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map(h => (
                <li key={h._id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-10 h-10 rounded-full bg-brand-soft text-brand-text flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{h.name}</p>
                    <p className="text-xs text-ink-muted truncate">{h.address || 'Хаяг оруулаагүй'}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setAdminsHoa(h)}>
                    <UserCog className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">Админ удирдах</span><span className="sm:hidden">Админ</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Шинэ СӨХ үүсгэх" maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-ink-muted">Шинэ СӨХ тусдаа орчинтой бөгөөд түүний админ зөвхөн энэ СӨХ-ийн мэдээллийг харж, удирдана.</p>
          <FormField label="СӨХ-ийн нэр">
            <input className={fieldInputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Жишээ: Алтан гадас СӨХ…" autoComplete="off" required />
          </FormField>
          <FormField label="Хаяг (заавал биш)">
            <input className={fieldInputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Дүүрэг, хороо…" autoComplete="off" />
          </FormField>

          <fieldset className="border-t border-line pt-4 space-y-3">
            <legend className="text-xs font-semibold text-ink-muted uppercase tracking-wide pr-2">Анхны админ</legend>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Овог">
                <input className={fieldInputCls} value={adminLastName} onChange={e => setAdminLastName(e.target.value)} autoComplete="off" required />
              </FormField>
              <FormField label="Нэр">
                <input className={fieldInputCls} value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} autoComplete="off" required />
              </FormField>
            </div>
            <FormField label="Имэйл">
              <input type="email" className={fieldInputCls} value={adminEmail} onChange={e => setAdminEmail(e.target.value)} autoComplete="off" spellCheck={false} required />
            </FormField>
            <FormField label="Түр нууц үг (6+ тэмдэгт)">
              <input type="password" className={fieldInputCls} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
            </FormField>
            <FormField label="Утас (заавал биш)">
              <input type="tel" inputMode="tel" className={fieldInputCls} value={adminPhone} onChange={e => setAdminPhone(e.target.value)} autoComplete="off" />
            </FormField>
          </fieldset>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Болих</Button>
            <Button type="submit" loading={creating} disabled={!canCreate}>СӨХ үүсгэх</Button>
          </div>
        </form>
      </Modal>

      {adminsHoa && (
        <HoaAdminsModal hoa={adminsHoa} onClose={() => setAdminsHoa(null)} />
      )}
    </div>
  )
}
