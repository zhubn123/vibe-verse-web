import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getAccessToken } from '@/utils/storage'

export default function GuestRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.isLoggedIn && getAccessToken()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
