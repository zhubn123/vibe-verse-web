import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginApi, logoutApi, type LoginRequest, type UserInfo } from '@/api/auth'
import {
  clearAuthState,
  getAccessToken,
  getRefreshToken,
  readStoredPermissionKeys,
  readStoredRoles,
  readStoredUserInfo,
  saveAuthState
} from '@/utils/storage'

interface AuthContextValue {
  token: string
  refreshToken: string
  userInfo: UserInfo | null
  roles: string[]
  permissionKeys: string[]
  isLoggedIn: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  forceLogout: () => void
  setUserInfo: (info: UserInfo) => void
  hasRole: (roleKey: string) => boolean
  hasPermission: (permissionKey: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getAccessToken())
  const [refreshToken, setRefreshToken] = useState(getRefreshToken())
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(readStoredUserInfo())
  const [roles, setRoles] = useState<string[]>(readStoredRoles())
  const [permissionKeys, setPermissionKeys] = useState<string[]>(readStoredPermissionKeys())

  async function login(data: LoginRequest) {
    const response = await loginApi(data)
    setToken(response.token)
    setRefreshToken(response.refreshToken || '')
    setUserInfoState(response.userInfo)
    setRoles(response.roles)
    setPermissionKeys(response.permissionKeys)
    saveAuthState(response.token, response.refreshToken, response.userInfo, response.roles, response.permissionKeys)
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // Local logout still wins when the backend cannot be reached.
    }
    forceLogout()
  }

  function forceLogout() {
    setToken('')
    setRefreshToken('')
    setUserInfoState(null)
    setRoles([])
    setPermissionKeys([])
    clearAuthState()
  }

  function setUserInfo(info: UserInfo) {
    setUserInfoState(info)
    saveAuthState(token, refreshToken || undefined, info, roles, permissionKeys)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      refreshToken,
      userInfo,
      roles,
      permissionKeys,
      isLoggedIn: !!token,
      login,
      logout,
      forceLogout,
      setUserInfo,
      hasRole: (roleKey: string) => roles.includes(roleKey),
      hasPermission: (permissionKey: string) => permissionKeys.includes(permissionKey)
    }),
    [permissionKeys, refreshToken, roles, token, userInfo]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
