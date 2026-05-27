import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { ConfirmProvider } from './context/ConfirmProvider.jsx'
import { AdminRoute } from './auth/AdminRoute.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { HallOfFamePage } from './pages/HallOfFamePage.jsx'
import { MainScreen } from './pages/MainScreen.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hall"
            element={
              <ProtectedRoute>
                <HallOfFamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  )
}
