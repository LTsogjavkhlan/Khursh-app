import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'

// Layouts + login stay relatively eager; heavy pages are code-split.
const MainLayout = lazy(() => import('./layouts/MainLayout'))
const Login = lazy(() => import('./pages/Login'))

const Home = lazy(() => import('./pages/Home'))
const Payments = lazy(() => import('./pages/Payments'))
const Calendar = lazy(() => import('./pages/Calendar'))
const LicensePlate = lazy(() => import('./pages/LicensePlate'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Contact = lazy(() => import('./pages/Contact'))
const Rules = lazy(() => import('./pages/Rules'))
const Feedback = lazy(() => import('./pages/Feedback'))
const Announcements = lazy(() => import('./pages/Announcements'))
const GroupChat = lazy(() => import('./pages/GroupChat'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-brand flex items-center justify-center">
      <div className="text-white text-center">
        <div className="mb-4">
          <Loader2 className="w-16 h-16 mx-auto animate-spin" />
        </div>
        <p className="text-base font-medium">Ачаалж байна…</p>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated } = useAuth()

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

            {isAuthenticated && (
              <>
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
                  {/* Electricity bills live on the Payments page now */}
                  <Route path="electricity" element={<Navigate to="/payments" replace />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="chat" element={<GroupChat />} />
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
