import { useState, useEffect } from 'react'
import { apiRequest } from '../../api/client'

function formatAddress(user) {
    if (!user) return '—'
    const parts = []
    if (user.building) parts.push(`${user.building}-р байр`)
    if (user.entrance) parts.push(`${user.entrance}-р орц`)
    if (user.floor) parts.push(`${user.floor}-р давхар`)
    if (user.apartmentNumber) parts.push(`${user.apartmentNumber}-р тоот`)
    return parts.length ? parts.join(', ') : (user.email || '—')
}

function formatExpiry(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = d - now
    const isExpired = diffMs < 0
    const label = d.toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    return { label, isExpired }
}

export default function AdminVehicles() {
    const [tab, setTab] = useState('primary') // 'primary' | 'guest'
    const [vehicles, setVehicles] = useState([])
    const [guestPasses, setGuestPasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ plate: '', model: '', color: '' })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const load = async () => {
        setLoading(true)
        try {
            const [v, g] = await Promise.all([
                apiRequest('/api/admin/vehicles'),
                apiRequest('/api/admin/guest-passes'),
            ])
            setVehicles(Array.isArray(v) ? v : [])
            setGuestPasses(Array.isArray(g) ? g : [])
        } catch {
            showToast('Өгөгдөл ачааллахад алдаа гарлаа', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const startEdit = (v) => {
        setEditingId(v._id)
        setEditForm({ plate: v.plate, model: v.model, color: v.color || '' })
    }

    const cancelEdit = () => { setEditingId(null) }

    const saveEdit = async (id) => {
        setSaving(true)
        try {
            const updated = await apiRequest(`/api/admin/vehicles/${id}`, {
                method: 'PUT',
                body: JSON.stringify(editForm),
            })
            setVehicles(vehicles.map(v => v._id === id ? { ...v, ...updated.vehicle } : v))
            setEditingId(null)
            showToast('Машины мэдээлэл шинэчлэгдлээ')
        } catch (err) {
            showToast(err.message || 'Алдаа гарлаа', 'error')
        } finally {
            setSaving(false)
        }
    }

    const deleteVehicle = async (id) => {
        if (!window.confirm('Энэ машиныг устгах уу?')) return
        try {
            await apiRequest(`/api/admin/vehicles/${id}`, { method: 'DELETE' })
            setVehicles(vehicles.filter(v => v._id !== id))
            showToast('Машин устгагдлаа')
        } catch (err) {
            showToast(err.message || 'Алдаа гарлаа', 'error')
        }
    }

    const deleteGuest = async (id) => {
        if (!window.confirm('Энэ зочны дугаарыг устгах уу?')) return
        try {
            await apiRequest(`/api/admin/guest-passes/${id}`, { method: 'DELETE' })
            setGuestPasses(guestPasses.filter(p => p._id !== id))
            showToast('Зочны дугаар устгагдлаа')
        } catch (err) {
            showToast(err.message || 'Алдаа гарлаа', 'error')
        }
    }

    const filteredVehicles = vehicles.filter(v => {
        const q = search.toLowerCase()
        return (
            v.plate?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            formatAddress(v.user).toLowerCase().includes(q)
        )
    })

    const filteredGuests = guestPasses.filter(p => {
        const q = search.toLowerCase()
        return (
            p.plate?.toLowerCase().includes(q) ||
            formatAddress(p.user).toLowerCase().includes(q)
        )
    })

    const primaryCount = vehicles.filter(v => v.isPrimary).length
    const activeGuestCount = guestPasses.filter(p => new Date(p.expiresAt) > new Date()).length

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Машины бүртгэл</h1>
                <p className="text-sm text-gray-500 mt-1">Оршин суугчдын болон зочдын машины мэдээлэл</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Нийт машин</p>
                    <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Үндсэн машин</p>
                    <p className="text-2xl font-bold text-blue-600">{primaryCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Зочны дугаар</p>
                    <p className="text-2xl font-bold text-gray-900">{guestPasses.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Идэвхтэй зочин</p>
                    <p className="text-2xl font-bold text-emerald-600">{activeGuestCount}</p>
                </div>
            </div>

            {/* Tabs + search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-0 gap-3 flex-wrap">
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setTab('primary')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'primary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Суурин машин
                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                {vehicles.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setTab('guest')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'guest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Зочин
                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'guest' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>
                                {guestPasses.length}
                            </span>
                        </button>
                    </div>
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Primary vehicles table */}
                {tab === 'primary' && (
                    <div className="overflow-x-auto mt-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Ачааллаж байна...</div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">Машин олдсонгүй</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Хаяг</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Дугаар</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Загвар</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Өнгө</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Төрөл</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredVehicles.map(v => (
                                        <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                            {editingId === v._id ? (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs text-gray-500">{formatAddress(v.user)}</div>
                                                        {v.user?.firstName && <div className="text-xs text-gray-400">{v.user.firstName} {v.user.lastName}</div>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            className="w-28 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono uppercase"
                                                            value={editForm.plate}
                                                            onChange={e => setEditForm({ ...editForm, plate: e.target.value.toUpperCase() })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            className="w-32 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            value={editForm.model}
                                                            onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            className="w-24 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            value={editForm.color}
                                                            onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3" />
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => saveEdit(v._id)}
                                                                disabled={saving}
                                                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                {saving ? '...' : 'Хадгалах'}
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                            >
                                                                Болих
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-800 whitespace-nowrap">{formatAddress(v.user)}</div>
                                                        {v.user?.firstName && <div className="text-xs text-gray-400">{v.user.firstName} {v.user.lastName}</div>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg text-sm">{v.plate}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">{v.model}</td>
                                                    <td className="px-4 py-3 text-gray-700">{v.color || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {v.isPrimary ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                                Үндсэн
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
                                                                Нэмэлт
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => startEdit(v)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Засах"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => deleteVehicle(v._id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Устгах"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Guest passes table */}
                {tab === 'guest' && (
                    <div className="overflow-x-auto mt-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Ачааллаж байна...</div>
                        ) : filteredGuests.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">Зочны дугаар олдсонгүй</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Хаяг</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Зочны дугаар</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Дуусах хугацаа</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Төлөв</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredGuests.map(p => {
                                        const { label, isExpired } = formatExpiry(p.expiresAt)
                                        return (
                                            <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-800 whitespace-nowrap">{formatAddress(p.user)}</div>
                                                    {p.user?.firstName && <div className="text-xs text-gray-400">{p.user.firstName} {p.user.lastName}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono font-semibold text-gray-900 bg-orange-50 px-2 py-1 rounded-lg text-sm border border-orange-100">{p.plate}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{label}</td>
                                                <td className="px-4 py-3">
                                                    {isExpired ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-600 rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                            Дууссан
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                            Идэвхтэй
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => deleteGuest(p._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Устгах"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                <div className="h-4" />
            </div>
        </div>
    )
}
