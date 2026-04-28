import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ToastProvider } from './components/Toast'
import ScrollToTop from './components/ScrollToTop'
import HeartLoader from './components/HeartLoader'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import ChoosePath from './pages/ChoosePath'
import LogIn from './pages/LogIn'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return children
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-navy flex items-center justify-center">
    <div className="text-center">
      <div className="text-3xl font-display font-bold tracking-widest mb-6">
        <span className="text-white">PERF</span>
        <span className="text-brand-red">PATH</span>
      </div>
      <HeartLoader size={64} text="Loading..." />
    </div>
  </div>
)

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUp />} />
        <Route path="/choose-path" element={user ? <ChoosePath /> : <Navigate to="/" replace />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LogIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/shadow-tracker" element={<ProtectedRoute><Dashboard page="shadow-tracker" /></ProtectedRoute>} />
        <Route path="/case-logger" element={<ProtectedRoute><Dashboard page="case-logger" /></ProtectedRoute>} />
        <Route path="/programs" element={<ProtectedRoute><Dashboard page="programs" /></ProtectedRoute>} />
        <Route path="/programs/:id" element={<ProtectedRoute><Dashboard page="program-detail" /></ProtectedRoute>} />
        <Route path="/hospitals" element={<ProtectedRoute><Dashboard page="hospitals" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Dashboard page="settings" /></ProtectedRoute>} />
        <Route path="/protocols" element={<ProtectedRoute><Dashboard page="protocols" /></ProtectedRoute>} />
        <Route path="/protocols/:id" element={<ProtectedRoute><Dashboard page="protocol-detail" /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard page="admin" /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
