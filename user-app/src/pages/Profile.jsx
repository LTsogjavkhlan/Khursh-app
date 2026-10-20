import { useState, useEffect, useCallback, useId } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import TenantInvites from '../components/TenantInvites'
import { useToast } from '../components/Toast'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import Dialog from '../components/ui/Dialog'
import Switch from '../components/ui/Switch'
import Field, { inputCls } from '../components/ui/Field'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { Check, Building2, Trash2, Plus, User, Lock, Mail, Phone, ChevronDown, Moon, Bell, Languages, LogOut, MapPin, UserMinus, Send, X } from 'lucide-react'

/* ── Helpers ─────────────────────────────────────────────── */

function fmtAddress(a) {
    const parts = []
    if (a.building)        parts.push(`${a.building}-р байр`)
    if (a.entrance)        parts.push(`${a.entrance}-р орц`)
    if (a.floor)           parts.push(`${a.floor}-р давхар`)
    if (a.apartmentNumber) parts.push(`${a.apartmentNumber}-р тоот`)
    return parts.join(', ')
}

const STATUS = {
    active:   { label: 'Оршин суугч', tone: 'success' },
    pending:  { label: 'Хянагдаж байна', tone: 'warning' },
    rejected: { label: 'Татгалзсан', tone: 'danger' },
    none:     { label: 'Хүсэлт илгээгдээгүй', tone: 'neutral' },
}

function SectionTitle({ id, children, action }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={id} className="text-[15px] font-semibold text-ink-muted">{children}</h2>
            {action}
        </div>
    )
}

function IconButton({ label, onClick, disabled, danger, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors disabled:opacity-50 ${FOCUS_RING} ${
                danger ? 'hover:bg-danger-bg hover:text-danger-text' : 'hover:bg-surface-muted hover:text-ink'
            }`}
        >
            {children}
        </button>
    )
}

/* ── AddressCard ─────────────────────────────────────────── */

function AddressCard({ addr, onActivate, onDelete, activating, deleting }) {
    const s = STATUS[addr.membershipStatus] || STATUS.none
    const addrLabel = fmtAddress(addr)
    const isActive = addr.isActive

    return (
        <Card className={isActive ? 'border-brand-text/50 ring-1 ring-brand-text/30' : ''}>
            <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand-text'}`}>
                    <Building2 size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-ink">{addr.hoaName || 'СӨХ тодорхойгүй'}</p>
                    <div className="mt-1"><StatusPill tone={s.tone}>{s.label}</StatusPill></div>
                </div>
                <IconButton label={`${addr.hoaName || ''} хаягийг устгах`} onClick={() => onDelete(addr._id)} disabled={deleting} danger>
                    <Trash2 size={17} aria-hidden="true" />
                </IconButton>
            </div>

            <p className={`mt-3 flex items-start gap-1.5 text-[13px] ${addrLabel ? 'text-ink-secondary' : 'italic text-ink-muted'}`}>
                <MapPin size={15} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
                {addrLabel || 'Дэлгэрэнгүй хаяг оруулаагүй'}
            </p>

            <div className="mt-4">
                {isActive ? (
                    <p className="flex h-10 items-center justify-center gap-1.5 rounded-control bg-brand-soft text-sm font-semibold text-brand-text">
                        <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Идэвхтэй хаяг
                    </p>
                ) : (
                    <Button variant="secondary" size="sm" fullWidth className="h-10" loading={activating} onClick={() => onActivate(addr._id)}>
                        {!activating && <Check size={15} strokeWidth={2.4} aria-hidden="true" />} Энэ хаягийг сонгох
                    </Button>
                )}
            </div>
        </Card>
    )
}

/* ── Add address (sheet) ─────────────────────────────────── */

function AddAddressDialog({ open, onClose, onSave, saving, error }) {
    const [hoaName, setHoaName] = useState('')
    const [building, setBuilding] = useState('')
    const [entrance, setEntrance] = useState('')
    const [floor, setFloor] = useState('')
    const [apartmentNumber, setApartmentNumber] = useState('')
    // HOA options come from the backend (single source of truth). If the list
    // can't be loaded we say so, rather than offering names the server rejects.
    const [hoaOptions, setHoaOptions] = useState(null) // null = loading
    const [hoaError, setHoaError] = useState(false)

    useEffect(() => {
        if (!open) return
        let active = true
        setHoaError(false)
        apiRequest('/api/hoas')
            .then(list => {
                if (!active) return
                setHoaOptions(Array.isArray(list) ? list.map(h => h.name).filter(Boolean) : [])
            })
            .catch(() => { if (active) { setHoaOptions([]); setHoaError(true) } })
        return () => { active = false }
    }, [open])

    return (
        <Dialog open={open} onClose={onClose} title="Орон сууц нэмэх" description="СӨХ болон хаягаа оруулаад хүсэлт илгээнэ үү. СӨХ-ийн админ баталгаажуулна.">
            <form
                className="space-y-4 pt-2"
                onSubmit={(e) => { e.preventDefault(); onSave({ hoaName, building, entrance, floor, apartmentNumber }) }}
            >
                {error && <p role="alert" className="rounded-control bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text">{error}</p>}

                <Field
                    label="СӨХ"
                    error={hoaError ? 'СӨХ-ийн жагсаалтыг ачаалж чадсангүй. Дахин оролдоно уу.' : undefined}
                >
                    <select className={`${inputCls} appearance-none`} value={hoaName} onChange={e => setHoaName(e.target.value)} required disabled={!hoaOptions?.length}>
                        <option value="">{hoaOptions === null ? 'Ачаалж байна…' : '— СӨХ сонгоно уу —'}</option>
                        {(hoaOptions || []).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                </Field>
                <Field label="Байр">
                    <input className={inputCls} type="text" inputMode="numeric" autoComplete="off" placeholder="Жишээ: 12…" value={building} onChange={e => setBuilding(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Орц">
                        <input className={inputCls} type="text" inputMode="numeric" autoComplete="off" placeholder="3…" value={entrance} onChange={e => setEntrance(e.target.value)} />
                    </Field>
                    <Field label="Давхар">
                        <input className={inputCls} type="text" inputMode="numeric" autoComplete="off" placeholder="5…" value={floor} onChange={e => setFloor(e.target.value)} />
                    </Field>
                </div>
                <Field label="Тоот">
                    <input className={inputCls} type="text" inputMode="numeric" autoComplete="off" placeholder="Жишээ: 101…" value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} />
                </Field>
                <Button type="submit" fullWidth loading={saving} disabled={!hoaName}>
                    {saving ? 'Илгээж байна…' : 'СӨХ рүү хүсэлт илгээх'}
                </Button>
            </form>
        </Dialog>
    )
}

/* ── Tenant management (per owned apartment) ─────────────── */

function ApartmentTenants({ apartment, tenants, invites, onChanged }) {
    const toast = useToast()
    const [open, setOpen] = useState(false)
    const [contact, setContact] = useState('')
    const [err, setErr] = useState(null)
    const [sentMsg, setSentMsg] = useState(null)
    const [sending, setSending] = useState(false)
    const [removingId, setRemovingId] = useState(null)
    const [cancellingId, setCancellingId] = useState(null)

    const isActive = apartment.membershipStatus === 'active'

    const resetForm = () => { setContact(''); setErr(null) }

    // The server answers the same way whether or not an account exists, so the
    // owner only ever sees "invite sent" — never who is registered.
    const handleInvite = async (e) => {
        e?.preventDefault()
        if (!contact.trim()) return
        setSending(true); setErr(null); setSentMsg(null)
        try {
            const data = await apiRequest(`/api/apartments/${apartment._id}/invites`, {
                method: 'POST',
                body: JSON.stringify({ contact: contact.trim() }),
            })
            setSentMsg(data?.message || 'Урилга илгээгдлээ')
            resetForm(); setOpen(false)
            await onChanged()
        } catch (e) {
            setErr(e.message || 'Урилга илгээхэд алдаа гарлаа')
        } finally {
            setSending(false)
        }
    }

    const handleCancelInvite = async (inviteId) => {
        setCancellingId(inviteId)
        try {
            await apiRequest(`/api/apartments/${apartment._id}/invites/${inviteId}`, { method: 'DELETE' })
            await onChanged()
        } catch (e) {
            toast.show(e.message || 'Цуцлахад алдаа гарлаа')
        } finally {
            setCancellingId(null)
        }
    }

    const handleRemove = async (userId) => {
        if (!window.confirm('Энэ түрээслэгчийг хасах уу? Тэдний хандалт шууд цуцлагдана.')) return
        setRemovingId(userId)
        try {
            await apiRequest(`/api/apartments/${apartment._id}/tenants/${userId}`, { method: 'DELETE' })
            await onChanged()
        } catch (e) {
            toast.show(e.message || 'Хасахад алдаа гарлаа')
        } finally {
            setRemovingId(null)
        }
    }

    const addrLabel = fmtAddress(apartment)

    return (
        <div className="rounded-card border border-line bg-canvas p-3.5">
            <p className="text-sm font-semibold text-ink">{apartment.hoaName || 'СӨХ'}</p>
            {addrLabel && <p className="mt-0.5 text-xs text-ink-muted">{addrLabel}</p>}

            <ul className="mt-3 space-y-2">
                {tenants.map(({ memberId, user }) => (
                    <li key={memberId} className="flex items-center gap-3 rounded-control bg-surface py-2 pl-3 pr-1">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-text">
                            {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</span>
                            <span className="block truncate text-xs text-ink-muted">{user.email}{user.phone ? ` · ${user.phone}` : ''}</span>
                        </span>
                        <IconButton label={`${user.firstName || user.email} түрээслэгчийг хасах`} onClick={() => handleRemove(user._id)} disabled={removingId === user._id} danger>
                            <UserMinus size={17} aria-hidden="true" />
                        </IconButton>
                    </li>
                ))}
                {invites.map(inv => (
                    <li key={inv._id} className="flex items-center gap-3 rounded-control border border-dashed border-line-strong/50 py-2 pl-3 pr-1">
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{inv.contact}</span>
                            <span className="block text-xs text-ink-muted">Урилга хүлээгдэж байна</span>
                        </span>
                        <IconButton label={`${inv.contact} урилгыг цуцлах`} onClick={() => handleCancelInvite(inv._id)} disabled={cancellingId === inv._id}>
                            <X size={17} aria-hidden="true" />
                        </IconButton>
                    </li>
                ))}
            </ul>
            {tenants.length === 0 && invites.length === 0 && <p className="mt-2 text-xs italic text-ink-muted">Түрээслэгч нэмээгүй байна</p>}

            {sentMsg && <p role="status" className="mt-3 rounded-control bg-success-bg px-3 py-2 text-xs text-success-text">{sentMsg}</p>}

            <div className="mt-3">
                {!isActive ? (
                    <p className="text-xs text-ink-muted">Баталгаажсаны дараа түрээслэгч урих боломжтой.</p>
                ) : !open ? (
                    <Button variant="soft" size="sm" onClick={() => { resetForm(); setSentMsg(null); setOpen(true) }}>
                        <Plus size={15} aria-hidden="true" /> Түрээслэгч урих
                    </Button>
                ) : (
                    <form onSubmit={handleInvite} className="space-y-2">
                        <Field label="Түрээслэгчийн имэйл эсвэл утас" hint="Тэд урилгыг хүлээн авсны дараа түрээслэгч болно." error={err || undefined}>
                            <input className={inputCls} autoComplete="off" spellCheck={false} placeholder="имэйл эсвэл утас…" value={contact} onChange={e => { setContact(e.target.value); setErr(null) }} />
                        </Field>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-10 flex-1" loading={sending} disabled={!contact.trim()}>
                                {!sending && <Send size={15} aria-hidden="true" />} Урих
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => { resetForm(); setOpen(false) }}>Болих</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

function TenantManagerCard({ refreshUser }) {
    const [apartments, setApartments] = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiRequest('/api/apartments/mine')
            setApartments(Array.isArray(data) ? data : [])
        } catch {
            setApartments([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleChanged = useCallback(async () => {
        await load()
        if (refreshUser) await refreshUser()
    }, [load, refreshUser])

    // Only show the section to owners (users with at least one owned apartment)
    if (!loading && apartments.length === 0) return null

    return (
        <section aria-labelledby="tenants-title">
            <SectionTitle id="tenants-title">Түрээслэгч</SectionTitle>
            <Card>
                <p className="mb-3 text-[13px] text-ink-muted">
                    Түрээслэгчээ урьж, төлбөр төлөх болон хаалга онгойлгох боломж олгоно. Урилгыг хүлээн авсны дараа хандалт нээгдэнэ.
                </p>
                {loading ? (
                    <SkeletonBlock className="h-24 rounded-card" />
                ) : (
                    <div className="space-y-3">
                        {apartments.map(({ apartment, tenants, invites }) => (
                            <ApartmentTenants key={apartment._id} apartment={apartment} tenants={tenants} invites={invites || []} onChanged={handleChanged} />
                        ))}
                    </div>
                )}
            </Card>
        </section>
    )
}

/* ── Settings rows ───────────────────────────────────────── */

function SettingRow({ icon: RowIcon, title, description, control, labelId }) {
    const Icon = RowIcon
    return (
        <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
                <Icon size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p id={labelId} className="text-[15px] font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-muted">{description}</p>
            </div>
            {control}
        </div>
    )
}

/* ── Main Profile Page ───────────────────────────────────── */

export default function Profile({ onLogout }) {
    const { user, completeLogin, token, logout, hasApartmentAccess, refreshUser } = useAuth()
    const { isDark: darkMode, toggleDark } = useTheme()
    const toast = useToast()
    const ids = { dark: useId(), notif: useId(), lang: useId() }

    // Personal info
    const [firstName, setFirstName] = useState('')
    const [lastName,  setLastName]  = useState('')
    const [email,     setEmail]     = useState('')
    const [phone,     setPhone]     = useState('')
    const [saving,    setSaving]    = useState(false)
    const [error,     setError]     = useState(null)

    // Addresses
    const [addresses,       setAddresses]       = useState([])
    const [addrLoading,     setAddrLoading]     = useState(true)
    const [showAddModal,    setShowAddModal]    = useState(false)
    const [addSaving,       setAddSaving]       = useState(false)
    const [addError,        setAddError]        = useState(null)
    const [activatingId,    setActivatingId]    = useState(null)
    const [deletingId,      setDeletingId]      = useState(null)

    // App settings (UI-only for now: not persisted or used elsewhere)
    const [notificationsOn, setNotificationsOn] = useState(true)
    const [language,        setLanguage]        = useState('mn')

    // Account management
    const [activeAccountSection, setActiveAccountSection] = useState(null)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword,     setNewPassword]     = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [newEmail,        setNewEmail]        = useState('')
    const [emailPassword,   setEmailPassword]   = useState('')
    const [newPhone,        setNewPhone]        = useState('')
    const [accountSaving,   setAccountSaving]   = useState(false)
    const [accountError,    setAccountError]    = useState(null)

    // ── Init ──────────────────────────────────────────────
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '')
            setLastName(user.lastName  || '')
            setEmail(user.email        || '')
            setPhone(user.phone        || '')
        }
    }, [user])

    const loadAddresses = useCallback(async () => {
        try {
            setAddrLoading(true)
            const data = await apiRequest('/api/addresses')
            setAddresses(Array.isArray(data) ? data : [])
        } catch {
            setAddresses([])
        } finally {
            setAddrLoading(false)
        }
    }, [])

    useEffect(() => { loadAddresses() }, [loadAddresses])

    // ── Handlers ──────────────────────────────────────────
    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSaving(true); setError(null)
        try {
            const data = await apiRequest('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ firstName, lastName, phone }),
            })
            completeLogin(token, data.user)
            toast.show('Таны мэдээлэл хадгалагдлаа')
        } catch (err) {
            setError(err.message || 'Хадгалахад алдаа гарлаа.')
        } finally {
            setSaving(false)
        }
    }

    const handleAddAddress = async (data) => {
        setAddSaving(true); setAddError(null)
        try {
            const created = await apiRequest('/api/addresses', {
                method: 'POST',
                body: JSON.stringify(data),
            })
            setAddresses(prev => [created, ...prev].sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0)))
            // Sync user context if it's their first/active address
            if (created.isActive) {
                completeLogin(token, {
                    ...user,
                    hoaName: created.hoaName,
                    building: created.building,
                    entrance: created.entrance,
                    floor: created.floor,
                    apartmentNumber: created.apartmentNumber,
                    membershipStatus: created.membershipStatus,
                })
            }
            setShowAddModal(false)
            toast.show('Хүсэлт СӨХ рүү илгээгдлээ')
        } catch (err) {
            setAddError(err.message || 'Хүсэлт илгээхэд алдаа гарлаа.')
        } finally {
            setAddSaving(false)
        }
    }

    const handleActivate = async (id) => {
        setActivatingId(id)
        try {
            const updated = await apiRequest(`/api/addresses/${id}/activate`, { method: 'PUT' })
            setAddresses(prev => prev.map(a => ({ ...a, isActive: a._id === id })))
            completeLogin(token, {
                ...user,
                hoaName: updated.hoaName,
                building: updated.building,
                entrance: updated.entrance,
                floor: updated.floor,
                apartmentNumber: updated.apartmentNumber,
                membershipStatus: updated.membershipStatus,
            })
        } catch (err) {
            toast.show(err.message || 'Алдаа гарлаа.')
        } finally {
            setActivatingId(null)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Энэ хаягийг устгах уу?')) return
        setDeletingId(id)
        try {
            await apiRequest(`/api/addresses/${id}`, { method: 'DELETE' })
            setAddresses(prev => {
                const remaining = prev.filter(a => a._id !== id)
                // If deleted was active, mark the next one as active
                if (prev.find(a => a._id === id)?.isActive && remaining.length > 0) {
                    remaining[0].isActive = true
                }
                return remaining
            })
            // Reload to get fresh active state from server
            loadAddresses()
        } catch (err) {
            toast.show(err.message || 'Устгахад алдаа гарлаа.')
        } finally {
            setDeletingId(null)
        }
    }

    const toggleAccountSection = (section) => {
        setActiveAccountSection(prev => prev === section ? null : section)
        setAccountError(null)
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        setNewEmail(''); setEmailPassword(''); setNewPhone('')
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) return setAccountError('Нууц үг таарахгүй байна')
        setAccountSaving(true)
        try {
            await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            toast.show('Нууц үг амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            setAccountError(err.message || 'Алдаа гарлаа')
        } finally {
            setAccountSaving(false)
        }
    }

    const handleChangeEmail = async (e) => {
        e.preventDefault()
        setAccountSaving(true)
        try {
            const data = await apiRequest('/api/auth/change-email', {
                method: 'PUT',
                body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
            })
            completeLogin(token, { ...user, ...data.user })
            setEmail(data.user.email)
            toast.show('Имэйл амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            setAccountError(err.message || 'Алдаа гарлаа')
        } finally {
            setAccountSaving(false)
        }
    }

    const handleChangePhone = async (e) => {
        e.preventDefault()
        setAccountSaving(true)
        try {
            const data = await apiRequest('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ firstName, lastName, phone: newPhone }),
            })
            completeLogin(token, data.user)
            setPhone(newPhone)
            toast.show('Утасны дугаар амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            setAccountError(err.message || 'Алдаа гарлаа')
        } finally {
            setAccountSaving(false)
        }
    }

    const handleLogout = () => { logout(); if (onLogout) onLogout() }

    const activeAddr = addresses.find(a => a.isActive)
    // A user with apartment access but no owned apartment is a tenant of someone
    const isTenantOnly = !addrLoading && addresses.length === 0 && hasApartmentAccess
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || '?'

    const ACCOUNT_ITEMS = [
        { id: 'password', label: 'Нууц үг солих', sub: 'Аюулгүй нууц үг тохируулах', icon: Lock },
        { id: 'email',    label: 'Имэйл солих',  sub: email,                       icon: Mail },
        { id: 'phone',    label: 'Утас солих',   sub: phone || 'Тодорхойгүй',      icon: Phone },
    ]

    return (
        <div className="space-y-8 pb-4 pt-2">
            <AddAddressDialog
                open={showAddModal}
                saving={addSaving}
                error={addError}
                onClose={() => { setShowAddModal(false); setAddError(null) }}
                onSave={handleAddAddress}
            />

            {/* ── Profile header ── */}
            <section aria-label="Профайл" className="rounded-[24px] p-5 text-white" style={{ background: 'linear-gradient(165deg, #1E4740 0%, #183B35 60%, #0F2A25 100%)' }}>
                <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl font-bold">{initials}</span>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold">{firstName} {lastName}</h1>
                        <p className="truncate text-sm text-white/70">{email}</p>
                    </div>
                </div>
                <p className="mt-4 flex items-start gap-1.5 text-sm text-white/80">
                    <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {activeAddr
                        ? `${activeAddr.hoaName}${fmtAddress(activeAddr) ? ' · ' + fmtAddress(activeAddr) : ''}`
                        : 'СӨХ-д бүртгэлгүй'}
                </p>
            </section>

            {/* ── Personal info ── */}
            <section aria-labelledby="personal-title">
                <SectionTitle id="personal-title">Хувийн мэдээлэл</SectionTitle>
                <Card>
                    {error && <p role="alert" className="mb-4 rounded-control bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text">{error}</p>}
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Овог">
                                <input type="text" className={inputCls} autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </Field>
                            <Field label="Нэр">
                                <input type="text" className={inputCls} autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Имэйл хаяг" hint="Имэйлээ доорх «Бүртгэл» хэсгээс солино.">
                            <input type="email" className={inputCls} value={email} readOnly disabled />
                        </Field>
                        <Field label="Утасны дугаар">
                            <input type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
                        </Field>
                        <Button type="submit" fullWidth loading={saving}>{saving ? 'Хадгалж байна…' : 'Хадгалах'}</Button>
                    </form>
                </Card>
            </section>

            {/* ── Apartments ── */}
            <section aria-labelledby="apartments-title">
                <SectionTitle
                    id="apartments-title"
                    action={
                        <Button variant="soft" size="sm" onClick={() => { setAddError(null); setShowAddModal(true) }}>
                            <Plus size={15} aria-hidden="true" /> Нэмэх
                        </Button>
                    }
                >
                    Орон сууц
                </SectionTitle>
                {addrLoading ? (
                    <SkeletonBlock className="h-36 rounded-card" />
                ) : addresses.length === 0 ? (
                    <Card className="text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                            <Building2 size={22} aria-hidden="true" />
                        </span>
                        <p className="text-[15px] font-semibold text-ink">Орон сууц бүртгэлгүй байна</p>
                        <p className="mt-1 text-sm text-ink-muted">«Нэмэх» товчоор СӨХ-д бүртгэлийн хүсэлт илгээнэ үү.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {addresses.map(addr => (
                            <AddressCard
                                key={addr._id}
                                addr={addr}
                                onActivate={handleActivate}
                                onDelete={handleDelete}
                                activating={activatingId === addr._id}
                                deleting={deletingId === addr._id}
                            />
                        ))}
                    </div>
                )}

                {isTenantOnly && (
                    <Card className="mt-3 flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-text">
                            <User size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[15px] font-semibold text-ink">Түрээслэгчээр холбогдсон</p>
                            <p className="text-[13px] text-ink-muted">Та {user?.hoaName || 'СӨХ'}-ийн орон сууцны түрээслэгч. Төлбөр төлөх, хаалга онгойлгох боломжтой.</p>
                        </div>
                    </Card>
                )}
            </section>

            {/* ── Tenant invites addressed to me ── */}
            <TenantInvites />

            {/* ── Tenant management (owners only) ── */}
            <TenantManagerCard refreshUser={refreshUser} />

            {/* ── App settings ── */}
            <section aria-labelledby="settings-title">
                <SectionTitle id="settings-title">Тохиргоо</SectionTitle>
                <Card padded={false} className="divide-y divide-line">
                    <SettingRow icon={Moon} labelId={ids.dark} title="Харанхуй горим" description="Өдөр болон харанхуй горим солих"
                        control={<Switch checked={darkMode} onChange={toggleDark} labelledBy={ids.dark} />} />
                    <SettingRow icon={Bell} labelId={ids.notif} title="Мэдэгдэл" description="Чухал мэдээллийг мэдэгдлээр хүлээн авах"
                        control={<Switch checked={notificationsOn} onChange={setNotificationsOn} labelledBy={ids.notif} />} />
                    <SettingRow icon={Languages} labelId={ids.lang} title="Хэл" description="Аппын хэлийг сонгох"
                        control={
                            <select aria-labelledby={ids.lang} value={language} onChange={e => setLanguage(e.target.value)}
                                className={`${inputCls.replace('w-full', '').replace('py-2.5', '')} min-h-10 w-28 shrink-0 py-1.5 text-sm`}>
                                <option value="mn">Монгол</option>
                                <option value="en">English</option>
                            </select>
                        } />
                </Card>
            </section>

            {/* ── Account ── */}
            <section aria-labelledby="account-title">
                <SectionTitle id="account-title">Бүртгэл</SectionTitle>
                <Card padded={false} className="divide-y divide-line">
                    {ACCOUNT_ITEMS.map(({ id, label, sub, icon: ItemIcon }) => {
                        const Icon = ItemIcon
                        const expanded = activeAccountSection === id
                        return (
                            <div key={id}>
                                <button
                                    type="button"
                                    onClick={() => toggleAccountSection(id)}
                                    aria-expanded={expanded}
                                    aria-controls={`account-${id}`}
                                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
                                        <Icon size={19} aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-medium text-ink">{label}</span>
                                        <span className="block truncate text-xs text-ink-muted">{sub}</span>
                                    </span>
                                    <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-ink-muted transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} />
                                </button>

                                {expanded && (
                                    <form
                                        id={`account-${id}`}
                                        onSubmit={id === 'password' ? handleChangePassword : id === 'email' ? handleChangeEmail : handleChangePhone}
                                        className="space-y-3 px-4 pb-4"
                                    >
                                        {accountError && <p role="alert" className="rounded-control bg-danger-bg px-3.5 py-2.5 text-sm text-danger-text">{accountError}</p>}
                                        {id === 'password' && <>
                                            <Field label="Одоогийн нууц үг">
                                                <input type="password" autoComplete="current-password" className={inputCls} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                                            </Field>
                                            <Field label="Шинэ нууц үг" hint="Хамгийн багадаа 6 тэмдэгт">
                                                <input type="password" autoComplete="new-password" minLength={6} className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                            </Field>
                                            <Field label="Шинэ нууц үгийг давтах">
                                                <input type="password" autoComplete="new-password" className={inputCls} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                            </Field>
                                        </>}
                                        {id === 'email' && <>
                                            <Field label="Шинэ имэйл хаяг">
                                                <input type="email" autoComplete="email" spellCheck={false} className={inputCls} value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                                            </Field>
                                            <Field label="Нууц үгээрээ баталгаажуулах">
                                                <input type="password" autoComplete="current-password" className={inputCls} value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required />
                                            </Field>
                                        </>}
                                        {id === 'phone' && (
                                            <Field label="Шинэ утасны дугаар">
                                                <input type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={newPhone} onChange={e => setNewPhone(e.target.value)} required />
                                            </Field>
                                        )}
                                        <Button type="submit" fullWidth loading={accountSaving}>{accountSaving ? 'Хадгалж байна…' : label}</Button>
                                    </form>
                                )}
                            </div>
                        )
                    })}
                </Card>
            </section>

            {/* ── Logout ── */}
            <Button variant="danger" fullWidth onClick={handleLogout}>
                <LogOut size={18} aria-hidden="true" /> Гарах
            </Button>
        </div>
    )
}
