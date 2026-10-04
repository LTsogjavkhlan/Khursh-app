import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import FormField, { fieldInputCls } from '../components/ui/FormField'

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
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Одоогийн админууд</h3>
          {loading ? (
            <Skeleton.List rows={2} />
          ) : admins.length === 0 ? (
            <p className="text-sm text-slate-400">Энэ СӨХ-д админ бүртгэгдээгүй байна.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map(a => (
                <li key={a._id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{a.email}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busyId === a._id}
                    onClick={() => handleDemote(a)}
                  >
                    Хасах
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Бүртгэлтэй хэрэглэгчийг админ болгох</h3>
          <form onSubmit={handlePromote} className="flex gap-2">
            <input
              className={fieldInputCls}
              placeholder="Имэйл, утас эсвэл ID"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" loading={promoting} disabled={!identifier.trim()} className="flex-shrink-0">
              Болгох
            </Button>
          </form>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Шинэ админ бүртгэх</h3>
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
              <input type="email" className={fieldInputCls} value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
            </FormField>
            <FormField label="Нууц үг">
              <input type="password" className={fieldInputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
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
      setLoading(true)
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
      setName(''); setAddress('')
      setAdminFirstName(''); setAdminLastName(''); setAdminEmail(''); setAdminPassword(''); setAdminPhone('')
      toast.success('СӨХ болон түүний админ амжилттай үүсгэгдлээ')
      await load()
    } catch (err) {
      toast.error(err.message || 'СӨХ үүсгэхэд алдаа гарлаа.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Байгууллагууд" subtitle="Системд бүртгэлтэй бүх СӨХ. Платформ админ шинэ СӨХ үүсгэж, админ томилох боломжтой." />

      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Шинэ СӨХ үүсгэх</h2>
        <p className="text-xs text-slate-500 -mt-1">Шинэ СӨХ нь тусдаа орчинтой байх бөгөөд түүний админ зөвхөн энэ СӨХ-ийн мэдээллийг харах, удирдах эрхтэй.</p>
        <FormField label="СӨХ-ийн нэр">
          <input className={fieldInputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Жишээ: Алтан гадас СӨХ" required />
        </FormField>
        <FormField label="Хаяг">
          <input className={fieldInputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Хаяг (заавал биш)" />
        </FormField>

        <div className="border-t border-slate-100 pt-3 mt-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Анхны админ</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Нэр">
                <input className={fieldInputCls} value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} required />
              </FormField>
              <FormField label="Овог">
                <input className={fieldInputCls} value={adminLastName} onChange={e => setAdminLastName(e.target.value)} required />
              </FormField>
            </div>
            <FormField label="Имэйл">
              <input type="email" className={fieldInputCls} value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
            </FormField>
            <FormField label="Нууц үг">
              <input type="password" className={fieldInputCls} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} minLength={6} required />
            </FormField>
            <FormField label="Утас (заавал биш)">
              <input className={fieldInputCls} value={adminPhone} onChange={e => setAdminPhone(e.target.value)} />
            </FormField>
          </div>
        </div>

        <Button type="submit" loading={creating} disabled={!canCreate} className="w-full">
          СӨХ болон админ үүсгэх
        </Button>
      </form>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <Skeleton.List rows={3} />
      ) : hoas.length === 0 ? (
        <EmptyState title="Бүртгэлтэй СӨХ алга." />
      ) : (
        <ul className="space-y-2">
          {hoas.map(h => (
            <Card key={h._id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{h.name}</p>
                {h.address && <p className="text-xs text-slate-500 mt-0.5 truncate">{h.address}</p>}
              </div>
              <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => setAdminsHoa(h)}>
                Админ удирдах
              </Button>
            </Card>
          ))}
        </ul>
      )}

      {adminsHoa && (
        <HoaAdminsModal hoa={adminsHoa} onClose={() => setAdminsHoa(null)} />
      )}
    </div>
  )
}
