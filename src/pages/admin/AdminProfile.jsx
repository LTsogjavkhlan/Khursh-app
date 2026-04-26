import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../api/client'

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
      <label className="text-sm font-medium text-slate-500 sm:w-36 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
      {...props}
    />
  )
}

function SaveButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  )
}

function Alert({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mt-3 ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
      {msg}
    </div>
  )
}

export default function AdminProfile() {
  const { user, token, completeLogin } = useAuth()

  // Basic info
  const [firstName, setFirstName]   = useState(user?.firstName || '')
  const [lastName, setLastName]     = useState(user?.lastName  || '')
  const [hoaName, setHoaName]       = useState(user?.hoaName   || '')
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoMsg, setInfoMsg]         = useState(null)

  // Change password
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwMsg, setPwMsg]           = useState(null)

  // Change email
  const [newEmail, setNewEmail]     = useState('')
  const [emailPw, setEmailPw]       = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg]         = useState(null)

  // Keep form in sync if auth context updates
  useEffect(() => {
    setFirstName(user?.firstName || '')
    setLastName(user?.lastName   || '')
    setHoaName(user?.hoaName     || '')
  }, [user])

  function flash(setter, msg, type = 'success') {
    setter({ msg, type })
    setTimeout(() => setter(null), 4000)
  }

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setInfoLoading(true)
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, hoaName }),
      })
      completeLogin(token, data.user)
      flash(setInfoMsg, 'Мэдээлэл амжилттай хадгалагдлаа')
    } catch (err) {
      flash(setInfoMsg, err.message || 'Алдаа гарлаа', 'error')
    } finally {
      setInfoLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPw !== confirmPw) return flash(setPwMsg, 'Нууц үг таарахгүй байна', 'error')
    setPwLoading(true)
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      flash(setPwMsg, 'Нууц үг амжилттай солигдлоо')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      flash(setPwMsg, err.message || 'Алдаа гарлаа', 'error')
    } finally {
      setPwLoading(false)
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      const data = await apiRequest('/api/auth/change-email', {
        method: 'PUT',
        body: JSON.stringify({ newEmail, currentPassword: emailPw }),
      })
      completeLogin(token, { ...user, ...data.user })
      flash(setEmailMsg, 'Имэйл амжилттай солигдлоо')
      setNewEmail(''); setEmailPw('')
    } catch (err) {
      flash(setEmailMsg, err.message || 'Алдаа гарлаа', 'error')
    } finally {
      setEmailLoading(false)
    }
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'А'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Профайл</h1>
        <p className="text-sm text-slate-500 mt-1">Дансны мэдээлэл болон тохиргоо</p>
      </div>

      {/* Avatar card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
          {initials}
        </div>
        <div>
          <p className="text-lg font-bold text-white">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Системийн администратор
            </span>
            {user?.hoaName && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-300">
                {user.hoaName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Basic info */}
      <Section
        title="Үндсэн мэдээлэл"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      >
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <FieldRow label="Нэр">
            <Input
              placeholder="Нэр"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Овог">
            <Input
              placeholder="Овог"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="СӨХ-ийн нэр">
            <Input
              placeholder="Жишээ: Голден Хилл СӨХ"
              value={hoaName}
              onChange={e => setHoaName(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Sidebar болон системд харагдах нэр</p>
          </FieldRow>
          <FieldRow label="Имэйл">
            <div className="px-3 py-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
              {user?.email}
            </div>
            <p className="text-xs text-slate-400 mt-1">Имэйл солихыг доорх хэсгээс хийнэ үү</p>
          </FieldRow>
          <div className="pt-1">
            <SaveButton loading={infoLoading}>Хадгалах</SaveButton>
          </div>
          <Alert msg={infoMsg?.msg} type={infoMsg?.type} />
        </form>
      </Section>

      {/* Change password */}
      <Section
        title="Нууц үг солих"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FieldRow label="Одоогийн нууц үг">
            <Input
              type="password"
              placeholder="Одоогийн нууц үг"
              value={currentPw}
              onChange={e => { setCurrentPw(e.target.value); setPwMsg(null) }}
              required
            />
          </FieldRow>
          <FieldRow label="Шинэ нууц үг">
            <Input
              type="password"
              placeholder="Хамгийн багадаа 6 тэмдэгт"
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setPwMsg(null) }}
              required
            />
          </FieldRow>
          <FieldRow label="Давтах">
            <Input
              type="password"
              placeholder="Шинэ нууц үгийг давтах"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setPwMsg(null) }}
              required
            />
          </FieldRow>
          <div className="pt-1">
            <SaveButton loading={pwLoading}>Нууц үг солих</SaveButton>
          </div>
          <Alert msg={pwMsg?.msg} type={pwMsg?.type} />
        </form>
      </Section>

      {/* Change email */}
      <Section
        title="Имэйл солих"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      >
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <FieldRow label="Шинэ имэйл">
            <Input
              type="email"
              placeholder="Шинэ имэйл хаяг"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailMsg(null) }}
              required
            />
          </FieldRow>
          <FieldRow label="Нууц үг">
            <Input
              type="password"
              placeholder="Нууц үгээрээ баталгаажуулах"
              value={emailPw}
              onChange={e => { setEmailPw(e.target.value); setEmailMsg(null) }}
              required
            />
          </FieldRow>
          <div className="pt-1">
            <SaveButton loading={emailLoading}>Имэйл солих</SaveButton>
          </div>
          <Alert msg={emailMsg?.msg} type={emailMsg?.type} />
        </form>
      </Section>
    </div>
  )
}
