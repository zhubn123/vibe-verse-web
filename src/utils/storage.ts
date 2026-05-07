const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'
const ROLES_KEY = 'roles'
const PERMISSION_KEYS_KEY = 'permission_keys'
const MENU_ITEMS_KEY = 'menu_items'
const MANUAL_LOGOUT_KEY = 'manual_logout'

export interface StoredMenuItem {
  id: number | string
  parentId: number | string
  menuKey: string
  title: string
  path?: string
  icon?: string
  permissionKey?: string
  sortOrder?: number
  children?: StoredMenuItem[]
}

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
  localStorage.removeItem(MENU_ITEMS_KEY)
}

export function markManualLogout() {
  sessionStorage.setItem(MANUAL_LOGOUT_KEY, '1')
}

export function consumeManualLogout(): boolean {
  const marked = sessionStorage.getItem(MANUAL_LOGOUT_KEY) === '1'
  sessionStorage.removeItem(MANUAL_LOGOUT_KEY)
  return marked
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

export function saveMenuItems(menuItems: StoredMenuItem[]) {
  localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(menuItems))
}

export function readStoredMenuItems(): StoredMenuItem[] {
  const raw = localStorage.getItem(MENU_ITEMS_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? normalizeMenuItems(parsed) : []
  } catch {
    localStorage.removeItem(MENU_ITEMS_KEY)
    return []
  }
}

function normalizeMenuItems(items: unknown[]): StoredMenuItem[] {
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => typeof item.menuKey === 'string' && typeof item.title === 'string')
    .map((item) => ({
      id: typeof item.id === 'string' || typeof item.id === 'number' ? item.id : '',
      parentId: typeof item.parentId === 'string' || typeof item.parentId === 'number' ? item.parentId : 0,
      menuKey: item.menuKey as string,
      title: item.title as string,
      path: typeof item.path === 'string' ? item.path : undefined,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
      permissionKey: typeof item.permissionKey === 'string' ? item.permissionKey : undefined,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : undefined,
      children: Array.isArray(item.children) ? normalizeMenuItems(item.children) : []
    }))
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
