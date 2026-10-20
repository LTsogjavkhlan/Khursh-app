import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { LogOut } from 'lucide-react'

export default function AdminProfile() {
  const { user, refreshUser, logout } = useAuth()
  const toast = useToast()
  const isPlatformAdmin = user?.role === 'platform_admin'

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const body = { firstName, lastName, phone }
      await apiRequest('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
      await refreshUser()
      toast.success('Мэдээлэл шинэчлэгдлээ')
    } catch (err) {
      toast.error(err.message || 'Алдаа гарлаа')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setSavingPassword(true)
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Нууц үг амжилттай солигдлоо')
    } catch (err) {
      toast.error(err.message || 'Алдаа гарлаа')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Профайл"
        subtitle={`${isPlatformAdmin ? 'Платформ админ' : 'СӨХ админ'} · ${user?.email}`}
      />

      <form onSubmit={saveProfile} className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Хувийн мэдээлэл</h2>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Нэр">
            <input className={fieldInputCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </FormField>
          <FormField label="Овог">
            <input className={fieldInputCls} value={lastName} onChange={e => setLastName(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Утасны дугаар">
          <input className={fieldInputCls} value={phone} onChange={e => setPhone(e.target.value)} />
        </FormField>
        {!isPlatformAdmin && (
          <FormField label="СӨХ-ийн нэр">
            {/* Assigned by a platform admin; not editable here */}
            <input className={fieldInputCls} value={user?.hoaName || ''} disabled readOnly />
          </FormField>
        )}
        <Button type="submit" loading={savingProfile} className="w-full">Хадгалах</Button>
      </form>

      <form onSubmit={savePassword} className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Нууц үг солих</h2>
        <FormField label="Одоогийн нууц үг">
          <input type="password" className={fieldInputCls} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        </FormField>
        <FormField label="Шинэ нууц үг">
          <input type="password" className={fieldInputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
        </FormField>
        <Button type="submit" variant="secondary" loading={savingPassword} className="w-full">Нууц үг солих</Button>
      </form>

      <div className="bg-surface border border-line rounded-2xl shadow-sm p-5">
        <Button variant="dangerSolid" onClick={logout} className="w-full">
          <LogOut className="w-4 h-4" />
          Системээс гарах
        </Button>
      </div>
    </div>
  )
}
