import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export function AdminRoute({ children }) {
  const { ready, user } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-aztec font-sans text-sm text-half-baked">
        Загрузка…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
