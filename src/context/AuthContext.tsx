import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginApi, logoutApi, type LoginRequest, type UserInfo } from '@/api/auth'
import { listCurrentMenusApi, type MenuItem } from '@/api/system'
import {
  clearAuthState,
  getAccessToken,
  getRefreshToken,
  markManualLogout,
  readStoredMenuItems,
  readStoredPermissionKeys,
  readStoredRoles,
  readStoredUserInfo,
  saveAuthState,
  saveMenuItems
} from '@/utils/storage'

interface AuthContextValue {
  token: string
  refreshToken: string
  userInfo: UserInfo | null
  roles: string[]
  permissionKeys: string[]
  menuItems: MenuItem[]
  isLoggedIn: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  forceLogout: () => void
  reloadMenus: () => Promise<MenuItem[]>
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>(readStoredMenuItems() as MenuItem[])

  async function login(data: LoginRequest) {
    const response = await loginApi(data)
    setToken(response.token)
    setRefreshToken(response.refreshToken || '')
    setUserInfoState(response.userInfo)
    setRoles(response.roles)
    setPermissionKeys(response.permissionKeys)
    saveAuthState(response.token, response.refreshToken, response.userInfo, response.roles, response.permissionKeys)
    await reloadMenus()
  }

  async function logout() {
    markManualLogout()
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
    setMenuItems([])
    clearAuthState()
  }

  async function reloadMenus(): Promise<MenuItem[]> {
    const nextMenuItems = await listCurrentMenusApi()
    setMenuItems(nextMenuItems)
    saveMenuItems(nextMenuItems)
    return nextMenuItems
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
      menuItems,
      isLoggedIn: !!token,
      login,
      logout,
      forceLogout,
      reloadMenus,
      setUserInfo,
      hasRole: (roleKey: string) => roles.includes(roleKey),
      hasPermission: (permissionKey: string) => permissionKeys.includes(permissionKey)
    }),
    [menuItems, permissionKeys, refreshToken, roles, token, userInfo]
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
