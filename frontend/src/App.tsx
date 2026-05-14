import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { authApi } from './api/auth'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user            = useAuthStore(s => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-[#0A0A0B] text-white/50 text-sm">
      Chargement du profil…
    </div>
  )
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0B] text-white gap-3">
      <p className="text-red-400 font-semibold">Accès refusé</p>
      <p className="text-white/50 text-sm">Email : <strong>{user.email}</strong></p>
      <p className="text-white/50 text-sm">Rôle actuel : <strong className="text-yellow-400">{user.role}</strong></p>
      <p className="text-white/30 text-xs">Rôle requis : ADMIN ou SUPER_ADMIN</p>
    </div>
  )
  return <>{children}</>
}

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user            = useAuthStore(s => s.user)
  const setUser         = useAuthStore(s => s.setUser)

  // Always refresh user from DB on load — role may have changed since last login
  useEffect(() => {
    if (isAuthenticated) {
      authApi.me().then(setUser).catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
