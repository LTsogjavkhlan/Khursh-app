import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { apiRequest } from '../api/client'
import {
    Bell,
    CircleUserRound,
    Home,
    CreditCard,
    Car,
    Menu,
    Calendar,
    ShieldCheck,
    MessageSquare,
    MessageCircle,
    Phone,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../components/Toast'
import { FEATURE_DISABLED_MESSAGE } from '../utils/features'
import { useAuth } from '../context/AuthContext.jsx'

// Shared focus ring for every interactive element in the shell
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

function HeaderIconLink({ to, label, icon, children }) {
    const Icon = icon
    return (
        <NavLink
            to={to}
            aria-label={label}
            className={({ isActive }) =>
                `relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${FOCUS} ${
                    isActive ? 'bg-brand-soft text-brand-text' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
                }`
            }
        >
            <Icon size={21} strokeWidth={1.9} />
            {children}
        </NavLink>
    )
}

export default function MainLayout() {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const [notificationCount, setNotificationCount] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const location = useLocation()
    const pollRef = useRef(null)
    const moreButtonRef = useRef(null)
    const moreMenuRef = useRef(null)
    const { isDark } = useTheme()
    const { hasApartmentAccess, hasFeature } = useAuth()
    const toast = useToast()

    // Primary navigation items for the bottom bar. Payments and gate access are
    // apartment-only features, so they only appear for users who own or rent an
    // apartment (owner/tenant); other users just see Home + Menu.
    const primaryNavItems = [
        {
            name: 'Нүүр',
            icon: Home,
            path: '/'
        },
        ...(hasApartmentAccess ? [
            {
                name: 'Төлбөр',
                icon: CreditCard,
                path: '/payments'
            },
            {
                name: 'Машин',
                icon: Car,
                path: '/license-plate',
                // Greyed out only when the HOA has every feature on this page off
                featureKeys: ['gateOpen', 'vehicleRegistration', 'guestPass'],
            },
        ] : []),
        {
            name: 'Цэс',
            icon: Menu,
            path: '#more'
        }
    ]

    // Secondary items for the "More" menu
    const secondaryNavItems = [
        {
            name: 'Хуанли',
            icon: Calendar,
            path: '/calendar'
        },
        {
            name: 'Зарлал',
            icon: Bell,
            path: '/announcements'
        },
        {
            name: 'Дүрэм',
            icon: ShieldCheck,
            path: '/rules'
        },
        {
            name: 'Санал, гомдол',
            icon: MessageSquare,
            path: '/feedback'
        },
        {
            name: 'Чат',
            icon: MessageCircle,
            path: '/chat'
        },
        {
            name: 'Холбоо барих',
            icon: Phone,
            path: '/contact'
        },
        {
            name: 'Профайл',
            icon: CircleUserRound,
            path: '/profile'
        }
    ]

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const data = await apiRequest('/api/notifications/unread-count')
            setNotificationCount(data.count ?? 0)
        } catch { /* user may not be logged in yet */ }
    }

    // Load count on mount and poll every 60 seconds
    useEffect(() => {
        fetchUnreadCount()
        pollRef.current = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(pollRef.current)
    }, [])

    // Reset badge to 0 when the user opens the notifications page
    useEffect(() => {
        if (location.pathname === '/notifications') {
            setNotificationCount(0)
        }
    }, [location.pathname])

    const toggleMoreMenu = () => {
        setIsMoreMenuOpen(!isMoreMenuOpen)
    }

    // "More" sheet: Escape closes it, focus moves into it when it opens and
    // returns to the menu button when it closes.
    useEffect(() => {
        if (!isMoreMenuOpen) return
        moreMenuRef.current?.querySelector('a')?.focus()
        const onKeyDown = (e) => { if (e.key === 'Escape') setIsMoreMenuOpen(false) }
        window.addEventListener('keydown', onKeyDown)
        const button = moreButtonRef.current
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            button?.focus()
        }
    }, [isMoreMenuOpen])

    const badgeLabel = notificationCount > 9 ? '9+' : notificationCount
    // Home renders its own full-bleed header (greeting, balance, icon buttons)
    const isHome = location.pathname === '/'

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-ink">

            {/* Top Header Bar (every page except Home) */}
            {!isHome && (
            <header
                className={`fixed inset-x-0 top-0 z-10 border-b border-line bg-surface pt-[env(safe-area-inset-top)] transition-shadow duration-200 motion-reduce:transition-none ${
                    isScrolled ? 'shadow-card' : ''
                }`}
            >
                <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
                    <NavLink to="/" className={`flex items-center gap-2.5 rounded-lg ${FOCUS}`} aria-label="Хөрш — нүүр хуудас">
                        <img
                            src={isDark ? '/icons/hurshlogowhite.png' : '/icons/hurshlogo-forest.png'}
                            alt=""
                            width={30}
                            height={30}
                            className="h-[30px] w-[30px]"
                        />
                        <span className="text-[17px] font-semibold tracking-tight text-ink">Хөрш</span>
                    </NavLink>

                    <div className="flex items-center gap-1.5">
                        <HeaderIconLink to="/chat" label="Чат" icon={MessageCircle} />
                        <HeaderIconLink
                            to="/notifications"
                            label={notificationCount > 0 ? `Мэдэгдэл, ${notificationCount} уншаагүй` : 'Мэдэгдэл'}
                            icon={Bell}
                        >
                            {notificationCount > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-danger-text px-1 text-[10px] font-bold leading-none text-surface tabular-nums"
                                >
                                    {badgeLabel}
                                </span>
                            )}
                        </HeaderIconLink>
                        <HeaderIconLink to="/profile" label="Профайл" icon={CircleUserRound} />
                    </div>
                </div>
            </header>
            )}

            {/* Main Content - with padding for header and nav */}
            {/* overflow-x-clip, not -hidden: hidden makes <main> a scroll
                container, which breaks Home's sticky hero */}
            <main className={`w-full flex-1 overflow-x-clip pb-[calc(104px+env(safe-area-inset-bottom))] ${
                // Home's white sheet runs to the bottom, so the page behind it is white too
                isHome ? 'bg-surface' : 'px-4 pt-[calc(64px+env(safe-area-inset-top))]'
            }`}>
                <div className="mx-auto w-full max-w-3xl">
                    <Outlet context={{ notificationCount }} />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            {/* Floating, rounded bottom bar; the current tab sits in a soft pill */}
            <nav aria-label="Үндсэн цэс" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
                <div
                    className="pointer-events-auto mx-auto grid h-[68px] max-w-md gap-1 rounded-[26px] border border-line bg-surface p-1.5 shadow-pop"
                    style={{ gridTemplateColumns: `repeat(${primaryNavItems.length}, 1fr)` }}
                >
                    {primaryNavItems.map((item) => {
                        const active = item.path === '#more' ? isMoreMenuOpen :
                            (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))
                        const unavailable = item.featureKeys?.every(key => !hasFeature(key))
                        const itemClass = `relative flex flex-col items-center justify-center gap-0.5 rounded-[20px] transition-colors duration-150 ${FOCUS} ${
                            unavailable ? 'text-ink-muted/40'
                            : active ? 'bg-surface-muted text-brand-text'
                            : 'text-ink-muted hover:text-ink'
                        }`
                        const content = (
                            <>
                                <item.icon size={22} strokeWidth={active ? 2.2 : 1.9} />
                                <span className={`text-[11.5px] ${active ? 'font-semibold text-ink' : 'font-medium'}`}>{item.name}</span>
                            </>
                        )

                        // The menu entry opens a sheet; it's a button, not a link
                        if (item.path === '#more') {
                            return (
                                <button
                                    key={item.name}
                                    ref={moreButtonRef}
                                    type="button"
                                    className={itemClass}
                                    aria-expanded={isMoreMenuOpen}
                                    aria-controls="more-menu"
                                    onClick={toggleMoreMenu}
                                >
                                    {content}
                                </button>
                            )
                        }

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={itemClass}
                                aria-disabled={unavailable || undefined}
                                onClick={unavailable ? (e) => { e.preventDefault(); toast.show(FEATURE_DISABLED_MESSAGE) } : undefined}
                            >
                                {content}
                            </NavLink>
                        )
                    })}
                </div>
            </nav>

            {/* More Menu Popup */}
            {isMoreMenuOpen && (
                <div
                    id="more-menu"
                    ref={moreMenuRef}
                    role="dialog"
                    aria-label="Бусад цэс"
                    className="shell-sheet fixed inset-x-3 z-20 mx-auto max-w-md overscroll-contain rounded-[24px] border border-line bg-surface shadow-pop"
                    style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
                >
                    <div aria-hidden="true" className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-line" />
                    <div className="grid grid-cols-3 gap-2 px-4 pb-5 pt-2">
                        {secondaryNavItems.map((item) => {
                            const active = location.pathname === item.path

                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsMoreMenuOpen(false)}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-card px-2 py-3.5 text-center transition-colors duration-150 ${FOCUS} ${
                                        active ? 'bg-brand-soft text-brand-text' : 'text-ink-secondary hover:bg-surface-muted'
                                    }`}
                                >
                                    <span className={`flex h-11 w-11 items-center justify-center rounded-control ${active ? 'bg-surface text-brand-text' : 'bg-surface-muted text-ink-secondary'}`}>
                                        <item.icon size={22} strokeWidth={1.9} />
                                    </span>
                                    <span className={`text-[13px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                                </NavLink>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Backdrop for More Menu */}
            {isMoreMenuOpen && (
                <div
                    aria-hidden="true"
                    className="shell-fade fixed inset-x-0 top-0 z-10"
                    style={{ bottom: 0, backgroundColor: 'var(--overlay)' }}
                    onClick={() => setIsMoreMenuOpen(false)}
                ></div>
            )}
        </div>
    )
}
