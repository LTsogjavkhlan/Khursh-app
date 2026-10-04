import { useTheme } from '../context/ThemeContext'
import { Lock } from 'lucide-react'
import TenantInvites from './TenantInvites'

// Friendly "no apartment access" panel shown on apartment-only features
// (payments, gate access) for users who neither own nor rent an apartment.
// Any pending tenant invite is shown first, so accepting it unlocks the page.
export default function ApartmentAccessGate({ title, message }) {
    const { colors } = useTheme()
    return (
        <div style={{ padding: '16px', paddingBottom: '80px' }}>
            <TenantInvites style={{ marginBottom: '12px' }} />
            <div style={{
                backgroundColor: colors.surface,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '44px 24px',
                textAlign: 'center',
                boxShadow: `0 1px 4px ${colors.shadow}`,
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
                    background: 'linear-gradient(135deg,#94a3b8,#64748b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Lock size={30} color="white" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>
                    {title || 'Орон сууцны хандалт байхгүй'}
                </h2>
                <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>
                    {message || 'Энэ хэсгийг ашиглахын тулд СӨХ-д бүртгэлтэй орон сууцтай байх шаардлагатай. Профайл хэсгээс орон сууцаа нэмэх эсвэл эзэмшигчээсээ түрээслэгчийн хандалт хүсээрэй.'}
                </p>
            </div>
        </div>
    )
}
