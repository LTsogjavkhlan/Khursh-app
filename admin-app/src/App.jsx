import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'

const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'))
const Login = lazy(() => import('./pages/Login'))

const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const AdminFeedback = lazy(() => import('./pages/AdminFeedback.jsx'))
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'))
const AdminNotifications = lazy(() => import('./pages/AdminNotifications.jsx'))
const AdminPayments = lazy(() => import('./pages/AdminPayments.jsx'))
const AdminCalendar = lazy(() => import('./pages/AdminCalendar.jsx'))
const AdminVehicles = lazy(() => import('./pages/AdminVehicles.jsx'))
const AdminContact = lazy(() => import('./pages/AdminContact.jsx'))
const AdminRules = lazy(() => import('./pages/AdminRules.jsx'))
const AdminReports = lazy(() => import('./pages/AdminReports.jsx'))
const AdminReportEditor = lazy(() => import('./pages/AdminReportEditor.jsx'))
const AdminProfile = lazy(() => import('./pages/AdminProfile.jsx'))
const GroupChat = lazy(() => import('./pages/GroupChat.jsx'))
const PlatformOrganizations = lazy(() => import('./pages/PlatformOrganizations.jsx'))
const PlatformHoaManagement = lazy(() => import('./pages/PlatformHoaManagement.jsx'))

function LoadingFallback() {
  return (
    <div role="status" className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center">
        <Loader2 aria-hidden="true" className="w-8 h-8 mx-auto mb-3 text-brand animate-spin motion-reduce:animate-none" />
        <p className="text-sm font-medium text-ink-muted">Ачаалж байна…</p>
      </div>
    </div>
  )
}

function NoAdminAccess() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center bg-surface border border-line rounded-card shadow-card p-8">
        <img src="/icons/hurshlogo-forest.png" alt="" width={40} height={40} className="w-10 h-10 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-ink mb-2">Танд админ эрх байхгүй байна</h1>
        <p className="text-sm text-ink-muted mb-6">Энэ систем зөвхөн СӨХ болон платформын админд зориулагдсан.</p>
        <button
          type="button"
          onClick={logout}
          className="h-10 px-5 rounded-control text-sm font-semibold text-on-brand bg-brand hover:bg-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Гарах
        </button>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated, user } = useAuth()
  const isPlatformAdmin = user?.role === 'platform_admin'
  const isAdmin = user?.role === 'admin' || isPlatformAdmin

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app-container">
          <Routes>
            {!isAuthenticated && (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}

            {isAuthenticated && !isAdmin && (
              <Route path="*" element={<NoAdminAccess />} />
            )}

            {isAuthenticated && isAdmin && (
              <>
                <Route path="/" element={<AdminLayout />}>
                  {isPlatformAdmin ? (
                    // Platform admins aren't scoped to an HOA; HOA pages would 403
                    <>
                      <Route index element={<Navigate to="organizations" replace />} />
                      <Route path="organizations" element={<PlatformOrganizations />} />
                      <Route path="hoa-management" element={<PlatformHoaManagement />} />
                    </>
                  ) : (
                    <>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="feedback" element={<AdminFeedback />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="notifications" element={<AdminNotifications />} />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route path="calendar" element={<AdminCalendar />} />
                      <Route path="vehicles" element={<AdminVehicles />} />
                      <Route path="contact" element={<AdminContact />} />
                      <Route path="rules" element={<AdminRules />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="reports/new" element={<AdminReportEditor />} />
                      <Route path="reports/:id" element={<AdminReportEditor />} />
                      <Route path="chat" element={<GroupChat />} />
                    </>
                  )}
                  <Route path="profile" element={<AdminProfile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </Suspense>
  )
}

export default App
