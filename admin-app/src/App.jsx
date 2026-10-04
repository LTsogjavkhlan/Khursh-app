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
const AdminProfile = lazy(() => import('./pages/AdminProfile.jsx'))
const GroupChat = lazy(() => import('./pages/GroupChat.jsx'))
const PlatformOrganizations = lazy(() => import('./pages/PlatformOrganizations.jsx'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="mb-4">
          <Loader2 className="w-16 h-16 mx-auto animate-spin" />
        </div>
        <p className="text-xl font-bold">Loading...</p>
      </div>
    </div>
  )
}

function NoAdminAccess() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold text-white mb-2">Танд админ эрх байхгүй байна</h1>
        <p className="text-sm text-slate-400 mb-6">Энэ систем зөвхөн СӨХ болон платформын админд зориулагдсан.</p>
        <button
          onClick={logout}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
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
