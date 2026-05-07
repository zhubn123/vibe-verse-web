import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'
import DictionaryManagementPage from './pages/system/DictionaryManagementPage'
import AuditLogPage from './pages/system/AuditLogPage'
import ForbiddenPage from './pages/system/ForbiddenPage'
import NotFoundPage from './pages/system/NotFoundPage'
import PermissionCatalogPage from './pages/system/PermissionCatalogPage'
import RoleManagementPage from './pages/system/RoleManagementPage'
import SystemConfigPage from './pages/system/SystemConfigPage'
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
            <ProtectedRoute permissions={['system:user:view']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/roles"
          element={
            <ProtectedRoute permissions={['system:role:view']}>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/dictionaries"
          element={
            <ProtectedRoute permissions={['system:dict:view']}>
              <DictionaryManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/audit-logs"
          element={
            <ProtectedRoute permissions={['system:audit:view']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/permissions"
          element={
            <ProtectedRoute permissions={['system:permission:view']}>
              <PermissionCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/configs"
          element={
            <ProtectedRoute permissions={['system:config:view']}>
              <SystemConfigPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
