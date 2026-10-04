import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import TenantInvites from '../components/TenantInvites'
import { Check, Building2, Trash2, Plus, User, Lock, Mail, Phone, ChevronDown } from 'lucide-react'

const HOA_LIST = [
    'Голден Хилл СӨХ',
    'Номин хотхон СӨХ',
    'Зүүн салхины СӨХ',
    'Энхтайвны СӨХ',
    'Хан уул дүүрэг СӨХ',
    'Баянзүрх СӨХ',
    'Сүхбаатар дүүрэг СӨХ',
]

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
    active:   { label: 'Оршин суугч',       bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' },
    pending:  { label: 'Хянагдаж байна',    bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    rejected: { label: 'Татгалзсан',         bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' },
    none:     { label: 'Хүсэлт илгээгдээгүй', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' },
}

/* ── AddressCard ─────────────────────────────────────────── */

function AddressCard({ addr, onActivate, onDelete, activating, deleting, colors }) {
    const s = STATUS[addr.membershipStatus] || STATUS.none
    const addrLabel = fmtAddress(addr)
    const isActive = addr.isActive

    return (
        <div style={{
            position: 'relative',
            borderRadius: '16px',
            border: `2px solid ${isActive ? '#3b82f6' : colors.border}`,
            backgroundColor: isActive ? (colors.isDark ? '#1e3a5f' : '#eff6ff') : colors.surface,
            padding: '16px',
            transition: 'border-color 0.2s, background-color 0.2s',
            boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
        }}>
            {/* Active checkmark */}
            {isActive && (
                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Check size={12} color="white" strokeWidth={3} />
                </div>
            )}

            {/* HOA name + status */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', paddingRight: isActive ? '32px' : 0 }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Building2 size={18} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, margin: 0, lineHeight: '1.3' }}>
                        {addr.hoaName || 'СӨХ тодорхойгүй'}
                    </p>
                    {/* Status badge */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        marginTop: '4px', padding: '2px 8px', borderRadius: '20px',
                        backgroundColor: s.bg, border: `1px solid ${s.border}`,
                        fontSize: '11px', fontWeight: '600', color: s.text,
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
                        {s.label}
                    </span>
                </div>
            </div>

            {/* Address details */}
            {addrLabel ? (
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 12px', lineHeight: '1.5' }}>
                    📍 {addrLabel}
                </p>
            ) : (
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 12px', fontStyle: 'italic' }}>
                    Дэлгэрэнгүй хаяг оруулаагүй
                </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {!isActive && (
                    <button
                        disabled={activating}
                        onClick={() => onActivate(addr._id)}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: '10px',
                            border: '1.5px solid #3b82f6', backgroundColor: 'transparent',
                            color: '#3b82f6', fontSize: '13px', fontWeight: '600',
                            cursor: activating ? 'wait' : 'pointer', transition: 'background-color 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                    >
                        {activating ? (
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                        ) : (
                            <Check size={13} strokeWidth={2.5} />
                        )}
                        Сонгох
                    </button>
                )}
                {isActive && (
                    <div style={{
                        flex: 1, padding: '8px 12px', borderRadius: '10px',
                        backgroundColor: '#3b82f6', color: 'white',
                        fontSize: '13px', fontWeight: '600', textAlign: 'center',
                    }}>
                        Идэвхтэй
                    </div>
                )}
                <button
                    disabled={deleting}
                    onClick={() => onDelete(addr._id)}
                    style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: '1.5px solid #fca5a5', backgroundColor: 'transparent',
                        color: '#ef4444', cursor: deleting ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.15s', flexShrink: 0,
                    }}
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}

/* ── AddAddressModal ─────────────────────────────────────── */

function AddAddressModal({ onClose, onSave, saving, error, colors }) {
    const [hoaName, setHoaName] = useState('')
    // HOA options come from the backend (single source of truth). Fall back to the
    // static list only if the request fails, so the dropdown is never empty.
    const [hoaOptions, setHoaOptions] = useState(HOA_LIST)
    useEffect(() => {
        let active = true
        apiRequest('/api/hoas')
            .then(list => {
                if (!active) return
                const names = Array.isArray(list) ? list.map(h => h.name).filter(Boolean) : []
                if (names.length > 0) setHoaOptions(names)
            })
            .catch(() => { /* keep fallback list */ })
        return () => { active = false }
    }, [])
    const [building, setBuilding] = useState('')
    const [entrance, setEntrance] = useState('')
    const [floor, setFloor] = useState('')
    const [apartmentNumber, setApartmentNumber] = useState('')

    const inp = {
        width: '100%', padding: '11px 14px', borderRadius: '11px',
        border: `1.5px solid ${colors.border}`, fontSize: '14px',
        backgroundColor: colors.surfaceAlt, color: colors.text,
        boxSizing: 'border-box',
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: '0',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: colors.surface,
                    borderRadius: '24px 24px 0 0',
                    padding: '24px 20px 32px',
                    width: '100%', maxWidth: '480px',
                    animation: 'slideUp 0.25s cubic-bezier(0.34,1.3,0.64,1)',
                    maxHeight: '90vh', overflowY: 'auto',
                }}
            >
                {/* Handle */}
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: colors.border, margin: '0 auto 20px' }} />

                <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>
                    Орон сууц нэмэх
                </h3>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 20px' }}>
                    СӨХ болон хаягаа оруулаад хүсэлт илгээнэ үү.
                </p>

                {error && (
                    <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#b91c1c' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '5px' }}>СӨХ сонгох *</label>
                        <select
                            style={{ ...inp, appearance: 'none' }}
                            value={hoaName}
                            onChange={e => setHoaName(e.target.value)}
                            required
                        >
                            <option value="">— СӨХ сонгоно уу —</option>
                            {hoaOptions.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '5px' }}>Байр</label>
                        <input style={inp} type="text" placeholder="Жишээ: 12" value={building} onChange={e => setBuilding(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '5px' }}>Орц</label>
                            <input style={inp} type="text" placeholder="3" value={entrance} onChange={e => setEntrance(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '5px' }}>Давхар</label>
                            <input style={inp} type="text" placeholder="5" value={floor} onChange={e => setFloor(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSub, marginBottom: '5px' }}>Тоот</label>
                        <input style={inp} type="text" placeholder="Жишээ: 101" value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} />
                    </div>

                    <button
                        disabled={saving || !hoaName}
                        onClick={() => onSave({ hoaName, building, entrance, floor, apartmentNumber })}
                        style={{
                            marginTop: '4px', width: '100%', padding: '13px',
                            borderRadius: '12px', border: 'none',
                            backgroundColor: saving || !hoaName ? '#93c5fd' : '#2563eb',
                            color: 'white', fontSize: '15px', fontWeight: '600',
                            cursor: saving || !hoaName ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}
                    >
                        {saving && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />}
                        {saving ? 'Илгээж байна...' : 'СӨХ рүү хүсэлт илгээх'}
                    </button>
                </div>

                <style>{`
                    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    )
}

/* ── Tenant management (per owned apartment) ─────────────── */

function ApartmentTenants({ apartment, tenants, invites, colors, onChanged }) {
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
    const handleInvite = async () => {
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
            alert(e.message || 'Цуцлахад алдаа гарлаа')
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
            alert(e.message || 'Хасахад алдаа гарлаа')
        } finally {
            setRemovingId(null)
        }
    }

    const addrLabel = fmtAddress(apartment)

    return (
        <div style={{
            borderRadius: '14px', border: `1.5px solid ${colors.border}`,
            backgroundColor: colors.surfaceAlt, padding: '14px',
        }}>
            <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: 0 }}>
                    {apartment.hoaName || 'СӨХ'}
                </p>
                {addrLabel && (
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>📍 {addrLabel}</p>
                )}
            </div>

            {/* Tenant list */}
            {tenants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {tenants.map(({ memberId, user }) => (
                        <div key={memberId} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '10px',
                            backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
                        }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '700',
                            }}>
                                {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                                </p>
                                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.email}{user.phone ? ` • ${user.phone}` : ''}
                                </p>
                            </div>
                            <button
                                disabled={removingId === user._id}
                                onClick={() => handleRemove(user._id)}
                                style={{
                                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                                    border: '1.5px solid #fca5a5', backgroundColor: 'transparent',
                                    color: '#ef4444', cursor: removingId === user._id ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                title="Хасах"
                            >
                                <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '12px', color: colors.textMuted, margin: '0 0 10px', fontStyle: 'italic' }}>
                    Түрээслэгч нэмээгүй байна
                </p>
            )}

            {/* Pending invites — shows only what the owner typed */}
            {invites.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {invites.map(inv => (
                        <div key={inv._id} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '7px 10px', borderRadius: '10px',
                            backgroundColor: colors.surface, border: `1px dashed ${colors.border}`,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: colors.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {inv.contact}
                                </p>
                                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>Урилга хүлээгдэж байна</p>
                            </div>
                            <button
                                disabled={cancellingId === inv._id}
                                onClick={() => handleCancelInvite(inv._id)}
                                style={{
                                    background: 'none', border: 'none', color: colors.textMuted,
                                    fontSize: '12px', cursor: cancellingId === inv._id ? 'wait' : 'pointer', flexShrink: 0,
                                }}
                            >
                                Цуцлах
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {sentMsg && (
                <div style={{ padding: '8px 12px', marginBottom: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', fontSize: '12px', color: '#166534' }}>
                    {sentMsg}
                </div>
            )}

            {/* Invite tenant */}
            {!isActive ? (
                <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                    Баталгаажсаны дараа түрээслэгч нэмэх боломжтой.
                </p>
            ) : !open ? (
                <button
                    onClick={() => { resetForm(); setSentMsg(null); setOpen(true) }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 12px', borderRadius: '9px',
                        backgroundColor: colors.accentBg, border: `1.5px solid ${colors.accent}`,
                        color: colors.accent, fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                >
                    <Plus size={13} strokeWidth={2.5} />
                    Түрээслэгч урих
                </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                        Түрээслэгчийн бүртгэлтэй имэйл эсвэл утасны дугаарыг оруулна уу. Тэд урилгыг хүлээн авсны дараа түрээслэгч болно.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            style={{
                                flex: 1, padding: '9px 12px', borderRadius: '10px',
                                border: `1.5px solid ${colors.border}`, fontSize: '13px',
                                backgroundColor: colors.surface, color: colors.text, boxSizing: 'border-box',
                            }}
                            placeholder="имэйл / утас"
                            value={contact}
                            onChange={e => { setContact(e.target.value); setErr(null) }}
                        />
                        <button
                            disabled={sending || !contact.trim()}
                            onClick={handleInvite}
                            style={{
                                padding: '9px 14px', borderRadius: '10px', border: 'none',
                                backgroundColor: sending || !contact.trim() ? '#93c5fd' : colors.accent,
                                color: 'white', fontSize: '13px', fontWeight: '600',
                                cursor: sending || !contact.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
                            }}
                        >
                            {sending ? '...' : 'Урих'}
                        </button>
                    </div>

                    {err && (
                        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', fontSize: '12px', color: '#b91c1c' }}>
                            {err}
                        </div>
                    )}

                    <button
                        onClick={() => { resetForm(); setOpen(false) }}
                        style={{
                            alignSelf: 'flex-start', background: 'none', border: 'none',
                            color: colors.textMuted, fontSize: '12px', cursor: 'pointer', padding: '2px 0',
                        }}
                    >
                        Болих
                    </button>
                </div>
            )}
        </div>
    )
}

function TenantManagerCard({ colors, cardStyle, titleStyle, refreshUser }) {
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

    // Only show the card to owners (users with at least one owned apartment)
    if (!loading && apartments.length === 0) return null

    return (
        <div style={cardStyle}>
            <h2 style={titleStyle}>Түрээслэгч</h2>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '-8px 0 16px' }}>
                Түрээслэгчээ урьж, төлбөр төлөх болон хаалга онгойлгох боломж олгоно. Урилгыг хүлээн авсны дараа хандалт нээгдэнэ.
            </p>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textMuted, fontSize: '14px', padding: '12px 0' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Ачаалж байна...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {apartments.map(({ apartment, tenants, invites }) => (
                        <ApartmentTenants
                            key={apartment._id}
                            apartment={apartment}
                            tenants={tenants}
                            invites={invites || []}
                            colors={colors}
                            onChanged={handleChanged}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ── Main Profile Page ───────────────────────────────────── */

export default function Profile({ onLogout }) {
    const headerRef  = useRef(null)
    const profileRef = useRef(null)
    const settingsRef = useRef(null)
    const logoutRef  = useRef(null)

    const { user, completeLogin, token, logout, hasApartmentAccess, refreshUser } = useAuth()
    const { isDark: darkMode, toggleDark, colors } = useTheme()

    // Personal info
    const [firstName, setFirstName] = useState('')
    const [lastName,  setLastName]  = useState('')
    const [email,     setEmail]     = useState('')
    const [phone,     setPhone]     = useState('')
    const [saving,    setSaving]    = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [error,     setError]     = useState(null)

    // Addresses
    const [addresses,       setAddresses]       = useState([])
    const [addrLoading,     setAddrLoading]     = useState(true)
    const [showAddModal,    setShowAddModal]     = useState(false)
    const [addSaving,       setAddSaving]        = useState(false)
    const [addError,        setAddError]         = useState(null)
    const [activatingId,    setActivatingId]     = useState(null)
    const [deletingId,      setDeletingId]       = useState(null)

    // App settings
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
    const [accountMsg,      setAccountMsg]      = useState(null)

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

    // GSAP entrance
    useEffect(() => {
        const tl = gsap.timeline()
        tl.from(headerRef.current,  { y: -20, opacity: 0, duration: 0.45, ease: 'power2.out' })
          .from(profileRef.current,  { y: 20,  opacity: 0, duration: 0.4,  ease: 'power1.out' }, '-=0.2')
          .from(settingsRef.current, { y: 20,  opacity: 0, duration: 0.4,  ease: 'power1.out' }, '-=0.2')
          .from(logoutRef.current,   { y: 20,  opacity: 0, duration: 0.4,  ease: 'power1.out' }, '-=0.2')
    }, [])

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
            setShowSuccess(true)
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
            alert(err.message || 'Алдаа гарлаа.')
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
            alert(err.message || 'Устгахад алдаа гарлаа.')
        } finally {
            setDeletingId(null)
        }
    }

    const showAccountMsg = (text, type = 'success') => {
        setAccountMsg({ text, type })
        setTimeout(() => setAccountMsg(null), 3500)
    }

    const toggleAccountSection = (section) => {
        setActiveAccountSection(prev => prev === section ? null : section)
        setAccountMsg(null)
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        setNewEmail(''); setEmailPassword(''); setNewPhone('')
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) return showAccountMsg('Нууц үг таарахгүй байна', 'error')
        setAccountSaving(true)
        try {
            await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            showAccountMsg('Нууц үг амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            showAccountMsg(err.message || 'Алдаа гарлаа', 'error')
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
            showAccountMsg('Имэйл амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            showAccountMsg(err.message || 'Алдаа гарлаа', 'error')
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
            showAccountMsg('Утасны дугаар амжилттай солигдлоо')
            toggleAccountSection(null)
        } catch (err) {
            showAccountMsg(err.message || 'Алдаа гарлаа', 'error')
        } finally {
            setAccountSaving(false)
        }
    }

    const handleLogout = () => { logout(); if (onLogout) onLogout() }

    // ── Active address for header display ──
    const activeAddr = addresses.find(a => a.isActive)

    // A user with apartment access but no owned apartment is a tenant of someone
    const isTenantOnly = !addrLoading && addresses.length === 0 && hasApartmentAccess

    // ── Styles ────────────────────────────────────────────
    const s = {
        container:    { padding: '16px 0 80px' },
        header:       { marginBottom: '24px' },
        headerTitle:  { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSub:    { fontSize: '14px', color: colors.textMuted },
        card: {
            backgroundColor: colors.surface,
            padding: '20px', borderRadius: '16px',
            boxShadow: `0 2px 4px ${colors.shadow}`,
            border: `1px solid ${colors.border}`,
            marginBottom: '20px',
        },
        sectionTitle: { fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' },
        label:        { display: 'block', fontSize: '14px', fontWeight: '500', color: colors.textSub, marginBottom: '6px' },
        input: {
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: `1px solid ${colors.border}`, fontSize: '15px',
            backgroundColor: colors.surfaceAlt, color: colors.text, boxSizing: 'border-box',
            transition: 'border-color 0.2s',
        },
        saveBtn: {
            width: '100%', padding: '14px', backgroundColor: colors.accent,
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '500', cursor: 'pointer',
        },
        saveBtnDisabled: { backgroundColor: '#93C5FD', cursor: 'not-allowed' },
        settingRow: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: `1px solid ${colors.border}`,
        },
        toggle: { position: 'relative', display: 'inline-block', width: '44px', height: '24px', marginLeft: '8px' },
        toggleSlider: {
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: colors.border, borderRadius: '24px', transition: 'background-color 0.3s',
        },
        toggleSliderOn: { backgroundColor: colors.accent },
        toggleThumb: {
            position: 'absolute', height: '20px', width: '20px', left: '2px', bottom: '2px',
            backgroundColor: 'white', borderRadius: '50%', transition: 'transform 0.3s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        },
        toggleThumbOn: { transform: 'translateX(20px)' },
        logoutBtn: {
            width: '100%', padding: '14px', backgroundColor: '#EF4444',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '500', cursor: 'pointer',
        },
    }

    return (
        <div style={s.container}>
            {/* Add address modal */}
            {showAddModal && (
                <AddAddressModal
                    colors={colors}
                    saving={addSaving}
                    error={addError}
                    onClose={() => { setShowAddModal(false); setAddError(null) }}
                    onSave={handleAddAddress}
                />
            )}

            {/* Success dialog */}
            {showSuccess && (
                <div
                    onClick={() => setShowSuccess(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 999,
                        backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        animation: 'fadeInOverlay 0.18s ease',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: colors.surface, borderRadius: '20px',
                            padding: '32px 28px 24px', maxWidth: '320px', width: '100%',
                            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                            border: `1px solid ${colors.border}`,
                            animation: 'zoomInDialog 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                    >
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Check size={30} color="#16a34a" strokeWidth={2.5} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>Амжилттай хадгалагдлаа!</h3>
                        <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 24px' }}>Таны мэдээлэл шинэчлэгдлээ.</p>
                        <button
                            onClick={() => setShowSuccess(false)}
                            style={{ width: '100%', padding: '12px', backgroundColor: colors.accent, color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            ОК
                        </button>
                    </div>
                    <style>{`
                        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
                        @keyframes zoomInDialog { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:scale(1) } }
                    `}</style>
                </div>
            )}

            {/* ── Header ── */}
            <header ref={headerRef} style={s.header}>
                <h1 style={s.headerTitle}>Хувийн мэдээлэл & Тохиргоо</h1>
                <p style={s.headerSub}>Бүртгэлийн мэдээллээ удирдах</p>
            </header>

            {/* ── Personal Info Card ── */}
            <div ref={profileRef} style={s.card}>
                <h2 style={s.sectionTitle}>Хувийн мэдээлэл</h2>

                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px', fontWeight: 'bold', color: colors.textMuted }}>
                        {(firstName[0] || '') + (lastName[0] || '') || '?'}
                    </div>
                    <div>
                        <p style={{ fontSize: '17px', fontWeight: '600', color: colors.text, margin: '0 0 2px' }}>{firstName} {lastName}</p>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                            {activeAddr
                                ? `${activeAddr.hoaName}${fmtAddress(activeAddr) ? ' • ' + fmtAddress(activeAddr) : ''}`
                                : 'СӨХ-д бүртгэлгүй'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#FEE2E2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSaveProfile}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={s.label}>Овог</label>
                        <input type="text" style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={s.label}>Нэр</label>
                        <input type="text" style={s.input} value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={s.label}>Имэйл хаяг</label>
                        <input type="email" style={{ ...s.input, opacity: 0.6, cursor: 'default' }} value={email} readOnly />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={s.label}>Утасны дугаар</label>
                        <input type="tel" style={s.input} value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{ ...s.saveBtn, ...(saving ? s.saveBtnDisabled : {}) }}
                    >
                        {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                    </button>
                </form>
            </div>

            {/* ── Address Cards ── */}
            <div style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ ...s.sectionTitle, margin: 0 }}>Орон сууцнууд</h2>
                        
                    </div>
                    <button
                        onClick={() => { setAddError(null); setShowAddModal(true) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            backgroundColor: colors.accentBg, border: `1.5px solid ${colors.accent}`,
                            color: colors.accent, fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Нэмэх
                    </button>
                </div>

                {addrLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textMuted, fontSize: '14px', padding: '20px 0' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Ачаалж байна...
                    </div>
                ) : addresses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: colors.textMuted }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏠</div>
                        <p style={{ fontSize: '14px', margin: '0 0 4px', fontWeight: '500', color: colors.text }}>Орон сууц бүртгэлгүй байна</p>
                        <p style={{ fontSize: '13px', margin: 0 }}>«Нэмэх» товчоор СӨХ-д бүртгэлийн хүсэлт илгээнэ үү</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {addresses.map(addr => (
                            <AddressCard
                                key={addr._id}
                                addr={addr}
                                colors={{ ...colors, isDark: darkMode }}
                                onActivate={handleActivate}
                                onDelete={handleDelete}
                                activating={activatingId === addr._id}
                                deleting={deletingId === addr._id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Tenant read-only badge ── */}
            {isTenantOnly && (
                <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <User size={20} color="white" />
                    </div>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, margin: '0 0 2px' }}>Түрээслэгчээр холбогдсон</p>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                            Та {user?.hoaName || 'СӨХ'}-ийн орон сууцны түрээслэгч. Төлбөр төлөх, хаалга онгойлгох боломжтой.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Tenant invites addressed to me ── */}
            <TenantInvites style={{ marginBottom: '20px' }} />

            {/* ── Tenant management (owners only) ── */}
            <TenantManagerCard
                colors={colors}
                cardStyle={s.card}
                titleStyle={s.sectionTitle}
                refreshUser={refreshUser}
            />

            {/* ── App Settings ── */}
            <div ref={settingsRef} style={s.card}>
                <h2 style={s.sectionTitle}>Аппын тохиргоо</h2>

                <div style={s.settingRow}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text, margin: '0 0 2px' }}>Харанхуй горим</p>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>Өдөр болон харанхуй горим солих</p>
                    </div>
                    <label style={s.toggle}>
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={darkMode} onChange={toggleDark} />
                        <span style={{ ...s.toggleSlider, ...(darkMode ? s.toggleSliderOn : {}) }}>
                            <span style={{ ...s.toggleThumb, ...(darkMode ? s.toggleThumbOn : {}) }} />
                        </span>
                    </label>
                </div>

                <div style={s.settingRow}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text, margin: '0 0 2px' }}>Мэдэгдлүүд</p>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>Чухал мэдээллүүдийг мэдэгдлээр хүлээн авах</p>
                    </div>
                    <label style={s.toggle}>
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={notificationsOn} onChange={() => setNotificationsOn(v => !v)} />
                        <span style={{ ...s.toggleSlider, ...(notificationsOn ? s.toggleSliderOn : {}) }}>
                            <span style={{ ...s.toggleThumb, ...(notificationsOn ? s.toggleThumbOn : {}) }} />
                        </span>
                    </label>
                </div>

                <div style={{ ...s.settingRow, borderBottom: 'none' }}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text, margin: '0 0 2px' }}>Хэл</p>
                        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>Аппын хэлийг сонгох</p>
                    </div>
                    <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceAlt, fontSize: '14px', color: colors.textSub }}
                    >
                        <option value="mn">Монгол хэл</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            {/* ── Account Management ── */}
            <div style={s.card}>
                <h2 style={s.sectionTitle}>Account тохиргоо</h2>

                {accountMsg && (
                    <div style={{
                        marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
                        backgroundColor: accountMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: accountMsg.type === 'success' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${accountMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    }}>{accountMsg.text}</div>
                )}

                {[
                    { id: 'password', label: 'Нууц үг солих', sub: 'Аюулгүй нууц үг тохируулах', iconBg: '#eff6ff', iconColor: '#2563eb', icon: Lock },
                    { id: 'email',    label: 'Имэйл солих',  sub: email,                            iconBg: '#f0fdf4', iconColor: '#16a34a', icon: Mail },
                    { id: 'phone',    label: 'Утас солих',   sub: phone || 'Тодорхойгүй',           iconBg: '#fff7ed', iconColor: '#ea580c', icon: Phone },
                ].map((item) => {
                    const { id, label, sub, iconBg, iconColor, icon: Icon } = item
                    return (
                    <div key={id} style={{ borderBottom: id !== 'phone' ? `1px solid ${colors.border}` : 'none' }}>
                        <button
                            onClick={() => toggleAccountSection(id)}
                            style={{ width: '100%', background: 'none', border: 'none', padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={18} color={iconColor} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text, margin: 0 }}>{label}</p>
                                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{sub}</p>
                                </div>
                            </div>
                            <ChevronDown size={16} color={colors.textMuted} style={{ transform: activeAccountSection === id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </button>

                        {activeAccountSection === id && (
                            <form
                                onSubmit={id === 'password' ? handleChangePassword : id === 'email' ? handleChangeEmail : handleChangePhone}
                                style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                                {id === 'password' && <>
                                    <input type="password" style={s.input} placeholder="Одоогийн нууц үг" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                                    <input type="password" style={s.input} placeholder="Шинэ нууц үг (хамгийн багадаа 6)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                    <input type="password" style={s.input} placeholder="Шинэ нууц үгийг давтах" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                </>}
                                {id === 'email' && <>
                                    <input type="email" style={s.input} placeholder="Шинэ имэйл хаяг" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                                    <input type="password" style={s.input} placeholder="Нууц үгээрээ баталгаажуулах" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required />
                                </>}
                                {id === 'phone' && (
                                    <input type="tel" style={s.input} placeholder="Шинэ утасны дугаар" value={newPhone} onChange={e => setNewPhone(e.target.value)} required />
                                )}
                                <button type="submit" disabled={accountSaving} style={{ ...s.saveBtn, ...(accountSaving ? s.saveBtnDisabled : {}) }}>
                                    {accountSaving ? 'Хадгалж байна...' : label}
                                </button>
                            </form>
                        )}
                    </div>
                    )
                })}
            </div>

            {/* ── Logout ── */}
            <button ref={logoutRef} onClick={handleLogout} style={s.logoutBtn}>
                Гарах
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
