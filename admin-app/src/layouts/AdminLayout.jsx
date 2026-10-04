import { useState, useEffect, useCallback } from 'react'
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
  CircleUserRound,
  Menu,
  X,
} from 'lucide-react'

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

const PROFILE_ITEM = {
  to: '/profile',
  label: 'Профайл',
  icon: <CircleUserRound className="w-5 h-5" strokeWidth={1.8} />,
}

// Platform admins aren't scoped to an HOA, so every HOA page would 403 for
// them — they only manage organizations.
const PLATFORM_NAV_ITEMS = [
  {
    to: '/organizations',
    label: 'Байгууллагууд',
    icon: <Building2 className="w-5 h-5" strokeWidth={1.8} />,
  },
  PROFILE_ITEM,
]

const NAV_ITEMS = (openFeedback, pendingPayments, pendingMembers) => [
  {
    to: '/dashboard',
    label: 'Нүүр хуудас',
    icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/notifications',
    label: 'Мэдэгдэл',
    icon: <Megaphone className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/feedback',
    label: 'Санал, гомдол',
    badge: openFeedback,
    icon: <MessageSquare className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/chat',
    label: 'Чат',
    icon: <MessageCircle className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/users',
    label: 'Хэрэглэгчид',
    badge: pendingMembers,
    icon: <Users className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/payments',
    label: 'Төлбөр',
    badge: pendingPayments,
    icon: <CreditCard className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/vehicles',
    label: 'Машин',
    icon: <Car className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/calendar',
    label: 'Хуанли',
    icon: <Calendar className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/contact',
    label: 'Холбоо барих',
    icon: <Phone className="w-5 h-5" strokeWidth={1.8} />,
  },
  {
    to: '/rules',
    label: 'Дүрэм журам',
    icon: <FileText className="w-5 h-5" strokeWidth={1.8} />,
  },
  PROFILE_ITEM,
]

export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openFeedback, setOpenFeedback] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingMembers, setPendingMembers] = useState(0)

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

  const navItems = isPlatformAdmin
    ? PLATFORM_NAV_ITEMS
    : NAV_ITEMS(openFeedback, pendingPayments, pendingMembers)
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : 'А'

  const sidebarContent = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/icons/hurshlogo.png" alt="" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.hoaName || (isPlatformAdmin ? 'Платформ' : 'СӨХ Систем')}</p>
            <p className="text-slate-400 text-xs truncate">{isPlatformAdmin ? 'Платформ админ' : 'СӨХ админ'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{icon}</span>
            <span className="flex-1 truncate">{label}</span>
            {badge ? <Badge count={badge} /> : null}
          </NavLink>
        ))}
      </nav>
    </div>
  )

  return (
    <ToastProvider>
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Mobile header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30 relative">
        <button
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Цэс нээх"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <p className="text-sm font-semibold text-slate-800">{user?.hoaName || 'СӨХ Систем'}</p>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
          {initials}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-0 left-0 h-screen md:h-screen
            w-64 bg-slate-900 flex flex-col overflow-hidden z-30
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:flex
          `}
        >
          <div className="md:hidden h-[52px] shrink-0" />
          {sidebarContent}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
