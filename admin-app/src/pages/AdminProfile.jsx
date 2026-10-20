import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import FormField, { fieldInputCls } from '../components/ui/FormField'
import { LogOut, Building2 } from 'lucide-react'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
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
    if (newPassword !== confirmPassword) { setPasswordError('Шинэ нууц үг таарахгүй байна'); return }
    setPasswordError(null)
    setSavingPassword(true)
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Нууц үг амжилттай солигдлоо')
    } catch (err) {
      toast.error(err.message || 'Алдаа гарлаа')
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || '?'

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Профайл" subtitle="Өөрийн мэдээлэл болон нэвтрэх тохиргоо." />

      {/* Identity */}
      <section aria-label="Бүртгэл" className="bg-surface border border-line rounded-card shadow-card p-5 flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="w-14 h-14 rounded-full bg-brand text-on-brand text-lg font-bold flex items-center justify-center shrink-0">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink truncate">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email}</p>
          <p className="text-sm text-ink-muted truncate">{user?.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{isPlatformAdmin ? 'Платформ админ' : 'СӨХ админ'}</Badge>
          {!isPlatformAdmin && user?.hoaName && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary"><Building2 className="w-4 h-4 text-ink-muted" aria-hidden="true" />{user.hoaName}</span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={saveProfile} aria-labelledby="info-title" className="bg-surface border border-line rounded-card shadow-card p-5 space-y-4">
          <h2 id="info-title" className="text-[15px] font-semibold text-ink">Хувийн мэдээлэл</h2>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Овог">
              <input className={fieldInputCls} autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} />
            </FormField>
            <FormField label="Нэр">
              <input className={fieldInputCls} autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Утасны дугаар">
            <input type="tel" inputMode="tel" autoComplete="tel" className={fieldInputCls} value={phone} onChange={e => setPhone(e.target.value)} />
          </FormField>
          {!isPlatformAdmin && (
            <FormField label="СӨХ (платформ админ оноосон)">
              <input className={fieldInputCls} value={user?.hoaName || ''} disabled readOnly />
            </FormField>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>Хадгалах</Button>
          </div>
        </form>

        <form onSubmit={savePassword} aria-labelledby="pw-title" className="bg-surface border border-line rounded-card shadow-card p-5 space-y-4">
          <h2 id="pw-title" className="text-[15px] font-semibold text-ink">Нууц үг солих</h2>
          {/* Lets password managers tie the new password to this account */}
          <input type="email" autoComplete="username" value={user?.email || ''} readOnly hidden />
          <FormField label="Одоогийн нууц үг">
            <input type="password" autoComplete="current-password" className={fieldInputCls} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </FormField>
          <FormField label="Шинэ нууц үг (6+ тэмдэгт)">
            <input type="password" autoComplete="new-password" className={fieldInputCls} value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(null) }} minLength={6} required />
          </FormField>
          <FormField label="Шинэ нууц үгийг давтах" error={passwordError}>
            <input type="password" autoComplete="new-password" className={fieldInputCls} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(null) }} required />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={savingPassword}>Нууц үг солих</Button>
          </div>
        </form>
      </div>

      <section aria-labelledby="session-title" className="bg-surface border border-line rounded-card shadow-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="session-title" className="text-[15px] font-semibold text-ink">Системээс гарах</h2>
          <p className="text-sm text-ink-muted">Энэ төхөөрөмж дээрх нэвтрэлтийг дуусгана.</p>
        </div>
        <Button variant="danger" onClick={logout}>
          <LogOut className="w-4 h-4" aria-hidden="true" /> Гарах
        </Button>
      </section>
    </div>
  )
}
