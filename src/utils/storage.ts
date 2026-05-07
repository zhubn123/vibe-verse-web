const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'
const ROLES_KEY = 'roles'
const PERMISSION_KEYS_KEY = 'permission_keys'

export interface StoredUserInfo {
  id: string
  username: string
  nickname?: string
  email?: string
  phone?: string
}

export function getAccessToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function saveAuthState(
  token: string,
  refreshToken: string | undefined,
  userInfo: StoredUserInfo,
  roles: string[],
  permissionKeys: string[]
) {
  localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
  localStorage.setItem(PERMISSION_KEYS_KEY, JSON.stringify(permissionKeys))
}

export function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(ROLES_KEY)
  localStorage.removeItem(PERMISSION_KEYS_KEY)
}

export function readStoredUserInfo(): StoredUserInfo | null {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as StoredUserInfo
  } catch {
    localStorage.removeItem(USER_INFO_KEY)
    return null
  }
}

export function readStoredRoles(): string[] {
  return readStringArray(ROLES_KEY)
}

export function readStoredPermissionKeys(): string[] {
  return readStringArray(PERMISSION_KEYS_KEY)
}

function readStringArray(key: string): string[] {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    localStorage.removeItem(key)
    return []
  }
}
