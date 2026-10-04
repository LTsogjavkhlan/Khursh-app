import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { apiRequest } from '../api/client'
import { Mail } from 'lucide-react'

function fmtAddress(a) {
    const parts = []
    if (a.building)        parts.push(`${a.building}-р байр`)
    if (a.entrance)        parts.push(`${a.entrance}-р орц`)
    if (a.floor)           parts.push(`${a.floor}-р давхар`)
    if (a.apartmentNumber) parts.push(`${a.apartmentNumber}-р тоот`)
    return parts.join(', ')
}

// Pending tenant invitations addressed to the current user, with accept /
// decline. Renders nothing when there are none. Accepting refreshes the
// session so apartment features unlock immediately.
export default function TenantInvites({ style }) {
    const { refreshUser } = useAuth()
    const { colors } = useTheme()
    const [invites, setInvites] = useState([])
    const [busyId, setBusyId] = useState(null)
    const [err, setErr] = useState(null)

    const load = useCallback(async () => {
        try {
            const data = await apiRequest('/api/apartments/invites/mine')
            setInvites(Array.isArray(data) ? data : [])
        } catch {
            setInvites([])
        }
    }, [])

    useEffect(() => { load() }, [load])

    const respond = async (id, action) => {
        setBusyId(id); setErr(null)
        try {
            await apiRequest(`/api/apartments/invites/${id}/${action}`, { method: 'POST' })
            await load()
            if (action === 'accept') await refreshUser()
        } catch (e) {
            setErr(e.message || 'Алдаа гарлаа')
            await load()
        } finally {
            setBusyId(null)
        }
    }

    if (invites.length === 0) return null

    return (
        <div style={{
            backgroundColor: colors.surface, borderRadius: '16px',
            border: `1.5px solid ${colors.accent}`, padding: '16px',
            boxShadow: `0 1px 4px ${colors.shadow}`, ...style,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Mail size={18} color={colors.accent} />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: colors.text, margin: 0 }}>
                    Түрээслэгчийн урилга
                </h2>
            </div>

            {err && (
                <div style={{ padding: '8px 12px', marginBottom: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', fontSize: '12px', color: '#b91c1c' }}>
                    {err}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {invites.map(inv => {
                    const busy = busyId === inv._id
                    const from = inv.invitedBy
                        ? `${inv.invitedBy.firstName || ''} ${inv.invitedBy.lastName || ''}`.trim()
                        : 'Орон сууцны эзэмшигч'
                    const addr = fmtAddress(inv.apartment)
                    return (
                        <div key={inv._id} style={{
                            padding: '12px', borderRadius: '12px',
                            backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}`,
                        }}>
                            <p style={{ fontSize: '13px', color: colors.text, margin: '0 0 2px' }}>
                                <strong>{from}</strong> таныг түрээслэгчээр урьж байна
                            </p>
                            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '0 0 10px' }}>
                                {inv.apartment.hoaName || 'СӨХ'}{addr ? ` · ${addr}` : ''}
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    disabled={busy}
                                    onClick={() => respond(inv._id, 'accept')}
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: '9px', border: 'none',
                                        backgroundColor: busy ? '#86efac' : '#16a34a', color: 'white',
                                        fontSize: '13px', fontWeight: '600', cursor: busy ? 'wait' : 'pointer',
                                    }}
                                >
                                    Хүлээн авах
                                </button>
                                <button
                                    disabled={busy}
                                    onClick={() => respond(inv._id, 'decline')}
                                    style={{
                                        flex: 1, padding: '8px 12px', borderRadius: '9px',
                                        border: `1.5px solid ${colors.border}`, backgroundColor: 'transparent',
                                        color: colors.textMuted, fontSize: '13px', fontWeight: '600',
                                        cursor: busy ? 'wait' : 'pointer',
                                    }}
                                >
                                    Татгалзах
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
