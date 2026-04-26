import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { ThemeProvider } from './context/ThemeContext.jsx'

import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Home from './pages/Home'
import Payments from './pages/Payments'
import Calendar from './pages/Calendar'
import LicensePlate from './pages/LicensePlate'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Contact from './pages/Contact'
import Rules from './pages/Rules'
import Feedback from './pages/Feedback'
import ElectricityBill from './pages/ElectricityBill'
import Announcements from './pages/Announcements'
import { useAuth } from './context/AuthContext.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import AdminFeedback from './pages/admin/AdminFeedback.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'
import AdminPayments from './pages/admin/AdminPayments.jsx'
import AdminCalendar from './pages/admin/AdminCalendar.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminVehicles from './pages/admin/AdminVehicles.jsx'
import AdminProfile from './pages/admin/AdminProfile.jsx'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-xl font-bold">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated, user } = useAuth()

  const isAdmin = user?.role === 'admin'

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app-container">
          <Routes>
            {!isAuthenticated && (
              <>
                {/* Public login route */}
                <Route path="/login" element={<Login />} />
                {/* Fallback to login for any other route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}

            {isAuthenticated && (
              <>
                {/* User app */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="license-plate" element={<LicensePlate />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="rules" element={<Rules />} />
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="electricity" element={<ElectricityBill />} />
                  <Route path="announcements" element={<Announcements />} />
                </Route>

                {/* Admin-only area */}
                <Route
                  path="/admin/*"
                  element={
                    isAdmin ? (
                      <AdminLayout />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                >
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="vehicles" element={<AdminVehicles />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Any other path when authenticated goes to home */}
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
