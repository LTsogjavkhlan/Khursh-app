import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'

function formatAddress(u) {
  const parts = []
  if (u.building)         parts.push(`${u.building}-р байр`)
  if (u.entrance)         parts.push(`${u.entrance}-р орц`)
  if (u.floor)            parts.push(`${u.floor}-р давхар`)
  if (u.apartmentNumber)  parts.push(`${u.apartmentNumber}-р тоот`)
  return parts.length ? parts.join(', ') : null
}

function AddressAvatar({ building, apartmentNumber, seed }) {
  const b   = building || '?'
  const apt = apartmentNumber || ''
  const palette = [
    'from-blue-400 to-blue-600',
    'from-violet-400 to-violet-600',
    'from-rose-400 to-rose-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-cyan-400 to-cyan-600',
  ]
  const color = palette[((seed ?? b)?.charCodeAt?.(0) ?? 0) % palette.length]
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex flex-col items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-[11px] leading-none">{b}</span>
      {apt && <span className="text-white/80 text-[9px] leading-none mt-0.5">{apt}</span>}
    </div>
  )
}

function MembershipBadge({ status }) {
  const map = {
    active:   { label: 'Оршин суугч',       cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    pending:  { label: 'Хүлээгдэж байна',   cls: 'bg-amber-50 text-amber-700',    dot: 'bg-amber-500 animate-pulse' },
    rejected: { label: 'Татгалзсан',         cls: 'bg-red-50 text-red-600',        dot: 'bg-red-500' },
    none:     { label: 'Бүртгэлгүй',         cls: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
  }
  const { label, cls, dot } = map[status] || map.none
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  )
}

function UserDetailModal({ user, onClose, onToggleRole, onCancelMembership, updatingId }) {
  if (!user) return null
  const address = formatAddress(user)
  const isUpdating = updatingId === user._id

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: 'zoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top banner */}
        <div className="h-16 bg-gradient-to-r from-slate-800 to-slate-600 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + role badge */}
          <div className="-mt-7 mb-4 flex items-end justify-between">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
              {user.building ? (
                <div className="flex flex-col items-center">
                  <span className="text-white font-bold text-base leading-none">{user.building}</span>
                  {user.apartmentNumber && <span className="text-white/80 text-[10px] leading-none mt-0.5">{user.apartmentNumber}</span>}
                </div>
              ) : (
                <span className="text-white font-bold text-lg">{user.firstName?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
              </span>
              <MembershipBadge status={user.membershipStatus} />
            </div>
          </div>

          {/* Address — primary */}
          {address ? (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Хаяг</p>
              <p className="text-lg font-bold text-gray-900">{address}</p>
              {user.hoaName && <p className="text-sm text-blue-600 font-medium mt-0.5">{user.hoaName}</p>}
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-400 italic">Хаяг бүртгэгдээгүй</p>
            </div>
          )}

          <div className="border-t border-gray-100 mb-4" />

          {/* Name + contact info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">Нэр</p>
                <p className="text-sm font-semibold text-gray-900">
                  {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Имэйл</p>
                <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Утас</p>
                  <p className="text-sm font-medium text-gray-800">{user.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Үйлдлүүд</p>

            {/* Role toggle */}
            <button
              disabled={isUpdating}
              onClick={() => onToggleRole(user)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                user.role === 'admin'
                  ? 'border-red-200 text-red-600 hover:bg-red-50 bg-white'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white'
              }`}
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              )}
              {user.role === 'admin' ? 'Хэрэглэгч болгох' : 'Админ болгох'}
            </button>

            {/* Cancel membership — only if active or pending */}
            {(user.membershipStatus === 'active' || user.membershipStatus === 'pending') && (
              <button
                disabled={isUpdating}
                onClick={() => onCancelMembership(user)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50 bg-white transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                )}
                СӨХ-өөс хасах
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const [pendingRequests, setPendingRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  async function loadUsers() {
    try {
      setLoading(true); setError(null)
      const data = await apiRequest('/api/admin/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Хэрэглэгчид ачаалахад алдаа гарлаа.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPendingRequests() {
    try {
      setLoadingRequests(true)
      const data = await apiRequest('/api/addresses/admin/pending')
      setPendingRequests(Array.isArray(data) ? data : [])
    } catch {
      setPendingRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => { loadUsers(); loadPendingRequests() }, [])

  // Sync selectedUser with updated users list
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find(u => u._id === selectedUser._id)
      if (updated) setSelectedUser(updated)
    }
  }, [users]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept(address) {
    setProcessingId(address._id)
    try {
      await apiRequest(`/api/addresses/admin/${address._id}/accept`, { method: 'PUT' })
      setPendingRequests(prev => prev.filter(a => a._id !== address._id))
      // Reflect the change in the users list too (if their active address got accepted)
      setUsers(prev => prev.map(u => u._id === address.user?._id
        ? { ...u, membershipStatus: 'active', hoaName: address.hoaName, building: address.building, entrance: address.entrance, floor: address.floor, apartmentNumber: address.apartmentNumber }
        : u
      ))
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(address) {
    if (!window.confirm('Энэ хүсэлтийг татгалзах уу?')) return
    setProcessingId(address._id)
    try {
      await apiRequest(`/api/addresses/admin/${address._id}/reject`, { method: 'PUT' })
      setPendingRequests(prev => prev.filter(a => a._id !== address._id))
      setUsers(prev => prev.map(u => u._id === address.user?._id
        ? { ...u, membershipStatus: 'rejected' }
        : u
      ))
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleToggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const label = formatAddress(user) || user.email
    if (!window.confirm(`"${label}"-г ${newRole === 'admin' ? 'Админ' : 'Хэрэглэгч'} болгох уу?`)) return
    try {
      setUpdatingId(user._id)
      await apiRequest(`/api/admin/users/${user._id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      })
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(err.message || 'Үүрэг өөрчлөхөд алдаа гарлаа.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCancelMembership(user) {
    const label = formatAddress(user) || user.email
    if (!window.confirm(`"${label}"-г СӨХ-өөс хасах уу? Хэрэглэгчид мэдэгдэл явуулна.`)) return
    try {
      setUpdatingId(user._id)
      await apiRequest(`/api/admin/memberships/${user._id}/cancel`, { method: 'PUT' })
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, membershipStatus: 'none', hoaName: '' } : u))
    } catch (err) {
      alert(err.message || 'Алдаа гарлаа.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.building || '').toLowerCase().includes(q) ||
      (u.apartmentNumber || '').toLowerCase().includes(q) ||
      (u.entrance || '').toLowerCase().includes(q) ||
      (u.floor || '').toLowerCase().includes(q)
    )
  })

  const adminCount   = users.filter(u => u.role === 'admin').length
  const userCount    = users.filter(u => u.role === 'user').length
  const activeMembers = users.filter(u => u.membershipStatus === 'active').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Detail modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleRole={handleToggleRole}
          onCancelMembership={handleCancelMembership}
          updatingId={updatingId}
        />
      )}

      {/* Header + stats */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Хэрэглэгчид</h1>
          <p className="text-sm text-slate-500 mt-1">Оршин суугчдын жагсаалт болон үүрэг удирдах</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">{users.length}</p>
            <p className="text-[11px] text-slate-500">Нийт</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-center shadow-sm">
            <p className="text-lg font-bold text-blue-600">{adminCount}</p>
            <p className="text-[11px] text-slate-500">Админ</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">{userCount}</p>
            <p className="text-[11px] text-slate-500">Хэрэглэгч</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-center shadow-sm">
            <p className="text-lg font-bold text-emerald-600">{activeMembers}</p>
            <p className="text-[11px] text-slate-500">Оршин суугч</p>
          </div>
        </div>
      </div>

      {/* Pending Membership Requests */}
      {(loadingRequests || pendingRequests.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-200 flex items-center gap-2.5 bg-amber-100/60">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-amber-900">Хянагдаж байгаа хүсэлтүүд</h2>
            {!loadingRequests && (
              <span className="ml-auto text-xs font-semibold bg-amber-500 text-white rounded-full px-2 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </div>
          {loadingRequests ? (
            <div className="flex items-center gap-2 px-5 py-4 text-sm text-amber-700">
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
              Ачаалж байна...
            </div>
          ) : (
            <div className="divide-y divide-amber-200/60">
              {pendingRequests.map(addr => {
                const addrLabel = formatAddress(addr)
                const userName  = addr.user ? `${addr.user.firstName || ''} ${addr.user.lastName || ''}`.trim() : ''
                return (
                  <div key={addr._id} className="flex items-center gap-3 px-5 py-3.5">
                    <AddressAvatar building={addr.building} apartmentNumber={addr.apartmentNumber} seed={addr.hoaName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {addrLabel || <span className="text-slate-400 italic">Хаяг оруулаагүй</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {addr.hoaName}
                      </p>
                    </div>
                    {userName && (
                      <p className="text-xs text-slate-400 hidden sm:block shrink-0">{userName}</p>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={processingId === addr._id}
                        onClick={() => handleAccept(addr)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {processingId === addr._id ? (
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Зөвшөөрөх
                      </button>
                      <button
                        disabled={processingId === addr._id}
                        onClick={() => handleReject(addr)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Татгалзах
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Search */}
      {!loading && users.length > 0 && (
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Байр, тоот, нэр, имэйлээр хайх..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Hint */}
      {!loading && users.length > 0 && (
        <p className="text-xs text-slate-400 -mt-3">
          Мөр дээр дарж дэлгэрэнгүй мэдээлэл болон үйлдлүүдийг харна уу
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-slate-400 py-8">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Ачаалж байна...
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Хэрэглэгч байхгүй байна.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Хаяг</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">СӨХ гишүүнчлэл</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Үүрэг</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">Бүртгэсэн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      Хайлтад тохирох хэрэглэгч олдсонгүй.
                    </td>
                  </tr>
                ) : filtered.map(user => {
                  const addr = formatAddress(user)
                  return (
                    <tr
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AddressAvatar building={user.building} apartmentNumber={user.apartmentNumber} seed={user.email} />
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {addr || <span className="text-slate-400 font-normal italic text-sm">Хаяг бүртгэгдээгүй</span>}
                            </p>
                            {user.hoaName && (
                              <p className="text-xs text-blue-500 mt-0.5">{user.hoaName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <MembershipBadge status={user.membershipStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.role === 'admin' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                          {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs hidden lg:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('mn-MN') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
