import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import { clearSession, readSession, saveSession, type UserSession } from './shared/session'

function App() {
  const navigate = useNavigate()
  const [session, setSession] = useState<UserSession | null>(() => readSession())

  const handleAuthenticated = (nextSession: UserSession) => {
    saveSession(nextSession)
    setSession(nextSession)
    navigate('/dashboard', { replace: true })
  }

  const handleSignOut = () => {
    clearSession()
    setSession(null)
    navigate('/auth', { replace: true })
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={session ? '/dashboard' : '/auth'} replace />}
      />
      <Route
        path="/auth"
        element={session ? <Navigate to="/dashboard" replace /> : <AuthPage onAuthenticated={handleAuthenticated} />}
      />
      <Route
        path="/login"
        element={<Navigate to="/auth" replace />}
      />
      <Route
        path="/dashboard"
        element={
          session ? (
            <DashboardPage session={session} onSignOut={handleSignOut} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/auth'} replace />} />
    </Routes>
  )
}

export default App
