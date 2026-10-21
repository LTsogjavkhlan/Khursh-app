import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import {
    DoorOpen, UserPlus, CircleDollarSign, Phone, CircleUserRound, Calendar, ShieldCheck, MessageSquare,
    Car, Bell, MessageCircle, Eye, EyeOff, Megaphone, Receipt, History, ChevronRight, Plus,
} from 'lucide-react'
import { useToast } from '../components/Toast'
import StatusPill from '../components/ui/StatusPill'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { FOCUS_RING } from '../components/ui/Button'
import { FEATURE_DISABLED_MESSAGE } from '../utils/features'

// Mongolian dates are built by hand: Chrome ships without Mongolian Intl data.
const NUM = new Intl.NumberFormat('mn-MN')
const money = (v) => `${NUM.format(Math.round(v || 0))}₮`
const dayLabel = (d) => { const x = new Date(d); return `${x.getMonth() + 1}-р сарын ${x.getDate()}` }
const monthLabel = (ym) => { const [y, m] = String(ym).split('-').map(Number); return `${y} оны ${m}-р сар` }

const PAYMENT_STATUS = {
    completed: { label: 'Төлсөн', tone: 'success' },
    pending: { label: 'Хүлээгдэж байна', tone: 'warning' },
    processing: { label: 'Боловсруулж байна', tone: 'info' },
    failed: { label: 'Амжилтгүй', tone: 'danger' },
}

// Round shortcut menu; `feature` marks the ones an HOA can switch off
const SHORTCUTS = [
    { to: '/license-plate', label: 'Хаалт', icon: DoorOpen, feature: 'gateOpen' },
    { to: '/license-plate', label: 'Зочин нэмэх', icon: UserPlus, feature: 'guestPass' },
    { to: '/payments', label: 'Төлбөр', icon: CircleDollarSign },
    { to: '/contact', label: 'Холбоо барих', icon: Phone },
    { to: '/calendar', label: 'Хуанли', icon: Calendar },
    { to: '/rules', label: 'Дүрэм', icon: ShieldCheck },
    { to: '/feedback', label: 'Санал', icon: MessageSquare },
    { to: '/profile', label: 'Профайл', icon: CircleUserRound },
]

const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Өглөөний мэнд!' : h < 18 ? 'Өдрийн мэнд!' : 'Оройн мэнд!'
}

// The hero always uses the forest brand, in light and dark mode alike
const HERO_BG = 'radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.10), transparent 55%), linear-gradient(165deg, #1E4740 0%, #183B35 55%, #0F2A25 100%)'
const HERO_BTN = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#183B35]`

function SectionHeader({ title, to, linkLabel = 'Бүгд', linkState }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink-muted">{title}</h2>
            {to && (
                <Link to={to} state={linkState} className={`inline-flex items-center gap-0.5 rounded-md text-sm font-semibold text-brand-text ${FOCUS_RING}`}>
                    {linkLabel} <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
            )}
        </div>
    )
}

function AnnouncementCarousel({ items }) {
    const [index, setIndex] = useState(0)
    const trackRef = useRef(null)
    const onScroll = () => {
        const el = trackRef.current
        if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
    }
    return (
        <section aria-label="Зарлал">
            <div
                ref={trackRef}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map(a => (
                    <Link
                        key={a._id}
                        to="/announcements"
                        className={`relative flex w-full shrink-0 snap-center flex-col overflow-hidden rounded-[20px] p-5 text-white ${FOCUS_RING}`}
                        style={{ background: 'radial-gradient(90% 120% at 100% 100%, rgba(143,208,188,0.22), transparent 60%), linear-gradient(135deg, #10302A 0%, #1F5A4E 100%)' }}
                    >
                        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
                            <Megaphone size={13} aria-hidden="true" /> Зарлал · {dayLabel(a.createdAt)}
                        </span>
                        <p className="text-[19px] font-semibold leading-snug text-balance">{a.title}</p>
                        <p className="mt-1.5 line-clamp-2 text-sm text-white/75">{a.content}</p>
                    </Link>
                ))}
            </div>
            {items.length > 1 && (
                <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                    {items.map((a, i) => (
                        <span key={a._id} className={`h-1.5 rounded-full transition-all duration-200 motion-reduce:transition-none ${i === index ? 'w-5 bg-brand-text' : 'w-1.5 bg-line-strong/50'}`} />
                    ))}
                </div>
            )}
        </section>
    )
}

export default function Home() {
    const { user, hasFeature } = useAuth()
    const toast = useToast()
    const { notificationCount = 0 } = useOutletContext() || {}

    const [announcements, setAnnouncements] = useState([])
    const [payments, setPayments] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [upcomingEvents, setUpcomingEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [hideBalance, setHideBalance] = useState(() => {
        try { return localStorage.getItem('hideBalance') === '1' } catch { return false }
    })

    const toggleBalance = () => setHideBalance(h => {
        try { localStorage.setItem('hideBalance', h ? '0' : '1') } catch { /* ignore */ }
        return !h
    })

    // Shortcuts to features the HOA may have switched off stay tappable but
    // explain why instead of navigating.
    const featureLink = (key) => !key || hasFeature(key) ? {} : {
        onClick: (e) => { e.preventDefault(); toast.show(FEATURE_DISABLED_MESSAGE) },
        'aria-disabled': true,
    }

    useEffect(() => {
        async function loadData() {
            try {
                const [announcementsData, paymentsData, vehiclesData, eventsData] = await Promise.allSettled([
                    apiRequest('/api/announcements'),
                    apiRequest('/api/payments/my-payments'),
                    apiRequest('/api/vehicles'),
                    apiRequest('/api/events'),
                ])

                if (announcementsData.status === 'fulfilled') {
                    const list = Array.isArray(announcementsData.value) ? announcementsData.value : []
                    setAnnouncements(list.slice(0, 3))
                }
                if (paymentsData.status === 'fulfilled') {
                    const list = Array.isArray(paymentsData.value) ? paymentsData.value : []
                    setPayments(list)
                }
                if (vehiclesData.status === 'fulfilled') {
                    const list = Array.isArray(vehiclesData.value) ? vehiclesData.value : []
                    setVehicles(list.slice(0, 2))
                }
                if (eventsData.status === 'fulfilled') {
                    const list = Array.isArray(eventsData.value) ? eventsData.value : []
                    const now = new Date()
                    setUpcomingEvents(list
                        .filter(e => new Date(e.date) >= now)
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 3))
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Measure both hero layers before paint so the shared gradient lines up
    // with no seam or flash; re-measure when they resize (rotation, font load).
    const barRef = useRef(null)
    const bodyRef = useRef(null)
    const [heroSize, setHeroSize] = useState({ bar: 0, total: 0 })
    useLayoutEffect(() => {
        const bar = barRef.current, body = bodyRef.current
        if (!bar || !body) return
        const measure = () => {
            const b = bar.offsetHeight
            const t = b + body.offsetHeight
            setHeroSize(prev => (prev.bar === b && prev.total === t ? prev : { bar: b, total: t }))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(bar); ro.observe(body)
        return () => ro.disconnect()
    }, [])

    // Shadow under the bar once the sheet has slid up to meet it
    const [sheetUnderBar, setSheetUnderBar] = useState(false)
    useEffect(() => {
        let frame = 0
        const check = () => {
            frame = 0
            const body = bodyRef.current
            // The sheet overlaps the hero by 24px (-mt-6), so it meets the bar 24px early
            if (body) setSheetUnderBar(window.scrollY >= body.offsetHeight - 24)
        }
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(check) }
        check()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
    }, [])

    const pendingTotal = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)
    const recentPayments = payments.slice(0, 3)

    const firstName = user?.firstName || 'Оршин суугч'
    const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
    const homeLine = [
        user?.hoaName,
        [user?.building && `${user.building}-р байр`, user?.apartmentNumber && `${user.apartmentNumber} тоот`].filter(Boolean).join(', '),
    ].filter(Boolean).join(' · ')

    // One gradient sized to the whole hero; each layer shows its own slice
    const heroBg = (offset) => heroSize.total
        ? { backgroundImage: HERO_BG, backgroundSize: `100% ${heroSize.total}px`, backgroundPosition: `0 ${-offset}px`, backgroundRepeat: 'no-repeat' }
        : { background: HERO_BG }

    return (
        <div>
            {/* ── Hero ─────────────────────────────────────────── */}
            {/* Layered hero: the top bar (avatar, greeting, icons) always stays
                in front; the balance block below it stays put while the sheet
                scrolls up over it. Both paint slices of one gradient so there's
                no seam between them. */}
            <header
                ref={barRef}
                className={`sticky top-0 z-20 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+20px)] text-white transition-shadow duration-200 motion-reduce:transition-none ${
                    sheetUnderBar ? 'shadow-[0_8px_18px_-8px_rgba(0,0,0,0.45)]' : ''
                }`}
                style={heroBg(0)}
            >
                <div className="flex items-center gap-2">
                    <Link to="/profile" aria-label="Профайл" className={`${HERO_BTN} mr-1 h-12 w-12 text-sm font-bold`}>
                        {initials || <CircleUserRound size={22} aria-hidden="true" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-white/75">{greeting()}</p>
                        <p className="truncate text-[17px] font-semibold uppercase tracking-wide" title={firstName}>{firstName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={toggleBalance}
                        aria-pressed={hideBalance}
                        aria-label={hideBalance ? 'Үлдэгдэл харуулах' : 'Үлдэгдэл нуух'}
                        className={HERO_BTN}
                    >
                        {hideBalance ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
                    </button>
                    <Link to="/chat" aria-label="Чат" className={HERO_BTN}>
                        <MessageCircle size={20} aria-hidden="true" />
                    </Link>
                    <Link
                        to="/notifications"
                        aria-label={notificationCount > 0 ? `Мэдэгдэл, ${notificationCount} уншаагүй` : 'Мэдэгдэл'}
                        className={`${HERO_BTN} relative`}
                    >
                        <Bell size={20} aria-hidden="true" />
                        {notificationCount > 0 && (
                            <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#183B35] bg-[#E5484D] px-1 text-[10px] font-bold leading-none">
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* Pinned only on screens tall enough to show it whole — otherwise
                its buttons could end up permanently below the fold. */}
            <section
                ref={bodyRef}
                className="relative z-0 px-5 pb-12 pt-3 text-white [@media(min-height:600px)]:sticky [@media(min-height:600px)]:top-[var(--hero-bar-h)]"
                style={{ ...heroBg(heroSize.bar), '--hero-bar-h': `${heroSize.bar}px` }}
                aria-label="Таны мэдээлэл"
                // A keyboard user tabbing into the covered balance block: bring it back into view
                onFocus={() => { if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}
            >
                {homeLine && <p className="truncate text-sm text-white/70">{homeLine}</p>}
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/60">Төлөгдөөгүй үлдэгдэл</p>
                <p className="mt-1 text-[32px] font-semibold leading-tight tracking-tight" aria-live="polite">
                    {loading ? <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-white/15 align-middle motion-reduce:animate-none" />
                        : hideBalance ? <span aria-label="Нуусан">•••••• ₮</span>
                        : pendingTotal > 0 ? money(pendingTotal) : 'Төлбөргүй'}
                </p>

                <div className="mt-5 flex gap-3">
                    <Link
                        to="/payments"
                        className="inline-flex h-11 items-center rounded-full bg-white px-6 text-[15px] font-semibold text-[#183B35] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#183B35]"
                    >
                        Төлбөр төлөх
                    </Link>
                    <Link
                        to="/payments"
                        state={{ tab: 'history' }}
                        className="inline-flex h-11 items-center rounded-full border border-white/35 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#183B35]"
                    >
                        Төлбөрийн түүх
                    </Link>
                </div>
            </section>

            {/* ── Sheet ────────────────────────────────────────── */}
            <div className="relative z-10 -mt-6 space-y-8 rounded-t-[28px] bg-surface px-4 pb-4 pt-7 shadow-[0_-10px_30px_-12px_rgba(0,0,0,0.25)]">
                {/* Round shortcut menu */}
                <nav aria-label="Түргэн цэс">
                    <ul className="grid grid-cols-4 gap-x-2 gap-y-5">
                        {SHORTCUTS.map(({ to, label, icon: ItemIcon, feature }) => {
                            const Icon = ItemIcon
                            const off = feature && !hasFeature(feature)
                            return (
                                <li key={label}>
                                    <Link
                                        to={to}
                                        {...featureLink(feature)}
                                        className={`group flex flex-col items-center gap-2 rounded-2xl py-1 text-center ${FOCUS_RING}`}
                                    >
                                        <span className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                                            off ? 'bg-surface-muted text-ink-muted/50' : 'bg-brand-soft text-brand-text group-hover:bg-surface-muted'
                                        }`}>
                                            <Icon size={24} strokeWidth={1.9} aria-hidden="true" />
                                        </span>
                                        <span className={`text-[12.5px] font-medium leading-tight ${off ? 'text-ink-muted' : 'text-ink-secondary'}`}>{label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Announcements banner */}
                {loading ? (
                    <SkeletonBlock className="h-[150px] rounded-[20px]" />
                ) : announcements.length > 0 && (
                    <AnnouncementCarousel items={announcements} />
                )}

                {/* Recent payments */}
                <section aria-labelledby="home-payments">
                    <SectionHeader title={<span id="home-payments">Сүүлийн төлбөрүүд</span>} to="/payments" linkLabel="Түүх" linkState={{ tab: 'history' }} />
                    {loading ? (
                        <div className="space-y-3"><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /></div>
                    ) : recentPayments.length === 0 ? (
                        <div className="flex items-center gap-3 py-2">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                                <History size={20} aria-hidden="true" />
                            </span>
                            <p className="text-[15px] text-ink-muted">Төлбөр олдсонгүй</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-line">
                            {recentPayments.map(p => {
                                const st = PAYMENT_STATUS[p.status] || { label: p.status, tone: 'neutral' }
                                return (
                                    <li key={p._id} className="flex items-center gap-3 py-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
                                            <Receipt size={20} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-medium text-ink">{p.description || 'СӨХ-ийн хураамж'}</p>
                                            <p className="text-xs text-ink-muted">
                                                {p.status === 'completed' && p.paidAt ? `${dayLabel(p.paidAt)}-нд төлсөн` : p.month ? monthLabel(p.month) : ''}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="text-[15px] font-semibold text-ink">{hideBalance ? '••••• ₮' : money(p.amount)}</span>
                                            <StatusPill tone={st.tone}>{st.label}</StatusPill>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>

                {/* Upcoming events */}
                <section aria-labelledby="home-events">
                    <SectionHeader title={<span id="home-events">Удахгүй болох үйл явдал</span>} to="/calendar" />
                    {loading ? (
                        <SkeletonBlock className="h-14" />
                    ) : upcomingEvents.length === 0 ? (
                        <p className="py-2 text-[15px] text-ink-muted">Товлосон үйл явдал алга.</p>
                    ) : (
                        <ul className="space-y-2">
                            {upcomingEvents.map(e => {
                                const d = new Date(e.date)
                                return (
                                    <li key={e._id} className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
                                        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface text-center shadow-card">
                                            <span className="text-[10px] font-semibold uppercase text-ink-muted">{d.getMonth() + 1}-р сар</span>
                                            <span className="text-lg font-semibold leading-none text-ink">{d.getDate()}</span>
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-medium text-ink">{e.title}</p>
                                            {(e.time || e.location) && <p className="truncate text-xs text-ink-muted">{[e.time, e.location].filter(Boolean).join(' · ')}</p>}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>

                {/* Vehicles */}
                <section aria-labelledby="home-vehicles">
                    <SectionHeader title={<span id="home-vehicles">Таны машин</span>} to="/license-plate" linkLabel="Удирдах" />
                    {loading ? (
                        <SkeletonBlock className="h-14" />
                    ) : (
                        <ul className="divide-y divide-line">
                            {vehicles.map(v => (
                                <li key={v._id} className="flex items-center gap-3 py-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                        <Car size={20} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold tracking-wide text-ink">{v.plate}</p>
                                        <p className="truncate text-xs text-ink-muted">{v.model}{v.color ? ` · ${v.color}` : ''}</p>
                                    </div>
                                    {v.isPrimary && <StatusPill tone="success" icon={false}>Үндсэн</StatusPill>}
                                </li>
                            ))}
                            <li className="pt-3">
                                <Link
                                    to="/license-plate"
                                    {...featureLink('vehicleRegistration')}
                                    className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-semibold ${FOCUS_RING} ${
                                        hasFeature('vehicleRegistration') ? 'border-line-strong/60 text-ink-secondary hover:bg-surface-muted' : 'border-line text-ink-muted'
                                    }`}
                                >
                                    <Plus size={16} aria-hidden="true" /> Машин нэмэх
                                </Link>
                            </li>
                        </ul>
                    )}
                </section>
            </div>
        </div>
    )
}
