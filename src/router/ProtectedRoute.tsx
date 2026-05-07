import { Navigate, useLocation } from 'react-router-dom'
import { consumeManualLogout, getAccessToken } from '@/utils/storage'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: string[]
  permissions?: string[]
}

export default function ProtectedRoute({ children, roles = [], permissions = [] }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()
  const hasLocalToken = !!getAccessToken()

  if (!auth.isLoggedIn || !hasLocalToken) {
    auth.forceLogout()
    if (consumeManualLogout()) {
      return <Navigate to="/login?reason=logout" replace />
    }
    const params = new URLSearchParams({
      reason: 'auth-required',
      redirect: `${location.pathname}${location.search}`
    })
    return <Navigate to={`/login?${params.toString()}`} replace />
  }

  if (roles.length > 0 && !roles.some((roleKey) => auth.hasRole(roleKey))) {
    const params = new URLSearchParams({
      reason: 'forbidden',
      redirect: `${location.pathname}${location.search}`,
      message: '当前账号没有访问该页面的权限'
    })
    return <Navigate to={`/403?${params.toString()}`} replace />
  }

  if (permissions.length > 0 && !permissions.some((permissionKey) => auth.hasPermission(permissionKey))) {
    const params = new URLSearchParams({
      reason: 'forbidden',
      redirect: `${location.pathname}${location.search}`,
      message: '当前账号没有访问该页面的权限'
    })
    return <Navigate to={`/403?${params.toString()}`} replace />
  }

  return children
}
