import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { ToastProvider } from '../components/ui/Toast'
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  MessageCircle,
  Users,
  CreditCard,
  Car,
  Calendar,
  Phone,
  FileText,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  Menu,
  X,
  FileBarChart2,
} from 'lucide-react'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
const icon = (component) => {
  const Icon = component
  return <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} aria-hidden="true" />
}

function CountBadge({ count, onDark }) {
  if (!count) return null
  return (
    <span
      className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold leading-none flex items-center justify-center tabular-nums ${
        onDark ? 'bg-white/20 text-white' : 'bg-danger-bg text-danger-text'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// Platform admins aren't scoped to an HOA, so every HOA page would 403 for
// them — they only manage organizations.
const PLATFORM_NAV = [
  {
    title: 'Платформ',
    items: [
      { to: '/organizations', label: 'Байгууллагууд', icon: icon(Building2) },
      { to: '/hoa-management', label: 'СӨХ удирдлага', icon: icon(SlidersHorizontal) },
    ],
  },
]

const HOA_NAV = (openFeedback, pendingPayments, pendingMembers) => [
  {
    title: null,
    items: [{ to: '/dashboard', label: 'Нүүр хуудас', icon: icon(LayoutDashboard) }],
  },
  {
    title: 'Санхүү',
    items: [
      { to: '/payments', label: 'Төлбөр', badge: pendingPayments, icon: icon(CreditCard) },
      { to: '/reports', label: 'Тайлан', icon: icon(FileBarChart2) },
    ],
  },
  {
    title: 'Оршин суугчид',
    items: [
      { to: '/users', label: 'Хэрэглэгчид', badge: pendingMembers, icon: icon(Users) },
      { to: '/vehicles', label: 'Машин', icon: icon(Car) },
    ],
  },
  {
    title: 'Харилцаа',
    items: [
      { to: '/notifications', label: 'Мэдэгдэл', icon: icon(Megaphone) },
      { to: '/feedback', label: 'Санал, гомдол', badge: openFeedback, icon: icon(MessageSquare) },
      { to: '/chat', label: 'Чат', icon: icon(MessageCircle) },
    ],
  },
  {
    title: 'Мэдээлэл',
    items: [
      { to: '/calendar', label: 'Хуанли', icon: icon(Calendar) },
      { to: '/contact', label: 'Холбоо барих', icon: icon(Phone) },
      { to: '/rules', label: 'Дүрэм журам', icon: icon(FileText) },
    ],
  },
]

function useIsDesktop() {
  const query = '(min-width: 768px)'
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openFeedback, setOpenFeedback] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingMembers, setPendingMembers] = useState(0)
  const menuButtonRef = useRef(null)
  const sidebarRef = useRef(null)

  const isPlatformAdmin = user?.role === 'platform_admin'

  const loadBadges = useCallback(async () => {
    if (isPlatformAdmin) return // HOA-only data
    try {
      const [feedbackRes, paymentsRes, membersRes] = await Promise.allSettled([
        apiRequest('/api/feedback/admin/all'),
        apiRequest('/api/payments/admin/all'),
        apiRequest('/api/admin/memberships/pending'),
      ])
      if (feedbackRes.status === 'fulfilled') {
        const list = Array.isArray(feedbackRes.value) ? feedbackRes.value : (feedbackRes.value?.feedback ?? [])
        setOpenFeedback(list.filter(f => f.status === 'open' || f.status === 'in_progress').length)
      }
      if (paymentsRes.status === 'fulfilled') {
        const list = Array.isArray(paymentsRes.value?.payments) ? paymentsRes.value.payments : []
        setPendingPayments(list.filter(p => p.status === 'pending').length)
      }
      if (membersRes.status === 'fulfilled') {
        setPendingMembers(Array.isArray(membersRes.value) ? membersRes.value.length : 0)
      }
    } catch { /* silent */ }
  }, [isPlatformAdmin])

  useEffect(() => { loadBadges() }, [loadBadges])
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Mobile drawer: Escape closes it; focus moves in on open and back to the
  // menu button on close.
  useEffect(() => {
    if (isDesktop || !sidebarOpen) return
    sidebarRef.current?.querySelector('a')?.focus()
    const onKeyDown = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    const button = menuButtonRef.current
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      button?.focus()
    }
  }, [isDesktop, sidebarOpen])

  const groups = isPlatformAdmin
    ? PLATFORM_NAV
    : HOA_NAV(openFeedback, pendingPayments, pendingMembers)
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : 'А'
  const orgName = user?.hoaName || (isPlatformAdmin ? 'Платформ' : 'СӨХ Систем')
  const roleLabel = isPlatformAdmin ? 'Платформ админ' : 'СӨХ админ'
  const current = groups.flatMap(g => g.items).find(i => location.pathname.startsWith(i.to))
  const currentLabel = current?.label || (location.pathname.startsWith('/profile') ? 'Профайл' : '')
  const drawerHidden = !isDesktop && !sidebarOpen

  const sidebar = (
    <aside
      ref={sidebarRef}
      id="admin-sidebar"
      aria-label="Үндсэн цэс"
      inert={drawerHidden || undefined}
      className={`fixed md:sticky top-0 left-0 z-30 h-screen w-[264px] shrink-0 flex flex-col bg-surface border-r border-line
        transition-transform duration-200 ease-out motion-reduce:transition-none
        ${sidebarOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full'} md:translate-x-0 md:shadow-none`}
    >
      {/* Identity */}
      <div className="h-16 px-5 flex items-center gap-3 shrink-0">
        <img src="/icons/hurshlogo-forest.png" alt="" width={32} height={32} className="w-8 h-8" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink truncate leading-tight">{orgName}</p>
          <p className="text-xs text-ink-muted truncate">{roleLabel}</p>
        </div>
        {/* The drawer covers the top bar's toggle on phones, so it has its own close */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Цэс хаах"
          className={`md:hidden -mr-2 w-9 h-9 rounded-control flex items-center justify-center text-ink-muted hover:bg-surface-muted hover:text-ink ${FOCUS}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.title || gi} className={gi === 0 ? 'pt-2' : 'pt-5'}>
            {group.title && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: itemIcon, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-control px-3 h-10 text-sm font-medium transition-colors duration-150 ${FOCUS} ${
                        isActive
                          ? 'bg-brand text-on-brand'
                          : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="shrink-0">{itemIcon}</span>
                        <span className="flex-1 truncate">{label}</span>
                        <CountBadge count={badge} onDark={isActive} />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account */}
      <div className="shrink-0 border-t border-line p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-control px-2.5 py-2 transition-colors duration-150 ${FOCUS} ${
              isActive ? 'bg-brand-soft' : 'hover:bg-surface-muted'
            }`
          }
        >
          <span className="w-9 h-9 rounded-full bg-brand-soft text-brand-text text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink truncate">{user?.firstName} {user?.lastName}</span>
            <span className="block text-xs text-ink-muted truncate">{user?.email}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  )

  return (
    <ToastProvider>
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Mobile backdrop */}
      {sidebarOpen && !isDesktop && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 animate-[fadeIn_150ms_ease-out]"
          style={{ backgroundColor: 'var(--overlay)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebar}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 shrink-0 bg-canvas/95 backdrop-blur-[2px] border-b border-line">
          <div className="h-full max-w-[1200px] mx-auto px-4 md:px-8 flex items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className={`md:hidden -ml-1 w-10 h-10 rounded-control flex items-center justify-center text-ink-secondary hover:bg-surface-muted ${FOCUS}`}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label={sidebarOpen ? 'Цэс хаах' : 'Цэс нээх'}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <nav aria-label="Байршил" className="min-w-0 flex items-center gap-1.5 text-sm">
              <span className="hidden sm:inline text-ink-muted truncate">{orgName}</span>
              {currentLabel && (
                <>
                  <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-ink truncate" aria-current="page">{currentLabel}</span>
                </>
              )}
            </nav>

            <NavLink
              to="/profile"
              aria-label={`Профайл: ${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
              className={`ml-auto flex items-center gap-2.5 rounded-full pl-1 pr-1 sm:pr-3 py-1 hover:bg-surface-muted transition-colors ${FOCUS}`}
            >
              <span className="w-8 h-8 rounded-full bg-brand text-on-brand text-xs font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-[13px] font-medium text-ink">{user?.firstName}</span>
                <span className="block text-[11px] text-ink-muted">{roleLabel}</span>
              </span>
            </NavLink>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div key={location.pathname} className="animate-page-in max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
