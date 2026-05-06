import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'
import DictionaryManagementPage from './pages/system/DictionaryManagementPage'
import ForbiddenPage from './pages/system/ForbiddenPage'
import NotFoundPage from './pages/system/NotFoundPage'
import RoleManagementPage from './pages/system/RoleManagementPage'
import UserManagementPage from './pages/system/UserManagementPage'
import GuestRoute from './router/GuestRoute'
import ProtectedRoute from './router/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          path="/system/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/roles"
          element={
            <ProtectedRoute roles={['admin']}>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/dictionaries"
          element={
            <ProtectedRoute roles={['admin']}>
              <DictionaryManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
