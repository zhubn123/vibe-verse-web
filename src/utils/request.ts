import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ResultCode } from '@/constants/result-code'
import { clearAuthState, getAccessToken, getRefreshToken, saveAuthState } from './storage'

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

interface AuthRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

type AuthInternalRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

interface RefreshTokenPayload {
  token?: string
  accessToken?: string
  refreshToken?: string
  userInfo?: {
    id: number | string
    username: string
    nickname?: string
    email?: string
    phone?: string
  }
  roles?: string[]
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const timeout = 10000

const request = axios.create({ baseURL, timeout })
const refreshRequest = axios.create({ baseURL, timeout })

let refreshPromise: Promise<string | null> | null = null

function isPublicAuthRequest(config?: AxiosRequestConfig): boolean {
  const url = config?.url || ''
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/refresh')
  )
}

function setAuthorizationHeader(config: AuthInternalRequestConfig | AuthRequestConfig, token: string): void {
  if (!config.headers) {
    config.headers = {}
  }
  if (typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    config.headers.Authorization = `Bearer ${token}`
  }
}

function redirectToLogin(): void {
  clearAuthState()
  if (window.location.pathname === '/login') {
    return
  }
  const params = new URLSearchParams({
    reason: 'session-expired',
    redirect: `${window.location.pathname}${window.location.search}`
  })
  window.location.replace(`/login?${params.toString()}`)
}

function redirectToForbidden(message = '当前账号没有访问权限，请联系管理员授权'): void {
  if (window.location.pathname === '/403') {
    return
  }
  const params = new URLSearchParams({
    reason: 'forbidden',
    redirect: `${window.location.pathname}${window.location.search}`,
    message
  })
  window.location.replace(`/403?${params.toString()}`)
}

function isUnauthorizedCase(code?: number, message?: string): boolean {
  if (code === ResultCode.UNAUTHORIZED) {
    return true
  }
  if (!message) {
    return false
  }
  const text = message.toLowerCase()
  return (
    text.includes('认证失败') ||
    text.includes('未登录') ||
    text.includes('登录过期') ||
    text.includes('token 无效') ||
    text.includes('token无效') ||
    (text.includes('token') && text.includes('invalid')) ||
    (text.includes('token') && text.includes('expired'))
  )
}

function isForbiddenCase(code?: number, message?: string): boolean {
  if (code === ResultCode.FORBIDDEN) {
    return true
  }
  if (!message) {
    return false
  }
  const text = message.toLowerCase()
  return text.includes('没有访问权限') || text.includes('无权限') || text.includes('forbidden')
}

function saveRefreshedAuthState(payload: RefreshTokenPayload): string | null {
  const nextToken = payload.token || payload.accessToken
  if (!nextToken || !payload.userInfo) {
    return null
  }
  saveAuthState(
    nextToken,
    payload.refreshToken,
    {
      id: String(payload.userInfo.id),
      username: payload.userInfo.username,
      nickname: payload.userInfo.nickname,
      email: payload.userInfo.email,
      phone: payload.userInfo.phone
    },
    payload.roles || []
  )
  return nextToken
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }
  if (!refreshPromise) {
    refreshPromise = refreshRequest
      .post<ApiResult<RefreshTokenPayload>>('/auth/refresh', { refreshToken })
      .then((response) => {
        const result = response.data
        if (result.code !== ResultCode.SUCCESS) {
          return null
        }
        return saveRefreshedAuthState(result.data)
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function retryAfterRefresh<T>(
  config: AuthInternalRequestConfig,
  message = '登录状态已失效，请重新登录'
): Promise<AxiosResponse<T>> {
  if (config._retry || config.skipAuthRefresh || isPublicAuthRequest(config)) {
    throw new Error(message)
  }
  config._retry = true
  const nextToken = await refreshAccessToken()
  if (!nextToken) {
    redirectToLogin()
    throw new Error(message)
  }
  setAuthorizationHeader(config, nextToken)
  return request.request<T>(config)
}

request.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    setAuthorizationHeader(config, token)
  }
  return config
})

request.interceptors.response.use(
  async (response) => {
    const result = response.data as Partial<ApiResult> | undefined
    if (isUnauthorizedCase(result?.code, result?.message)) {
      return retryAfterRefresh(response.config as AuthInternalRequestConfig, result?.message)
    }
    return response
  },
  async (error: AxiosError<ApiResult>) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络请求失败'
    if (isUnauthorizedCase(status, message) && error.config) {
      return retryAfterRefresh(error.config as AuthInternalRequestConfig, message)
    }
    if (isForbiddenCase(status, message) && !isPublicAuthRequest(error.config)) {
      redirectToForbidden(message)
    }
    throw new Error(message)
  }
)

export async function requestApi<T>(config: AuthRequestConfig): Promise<T> {
  const response = await request.request<ApiResult<T>>(config)
  const result = response.data
  if (result.code !== ResultCode.SUCCESS) {
    if (isUnauthorizedCase(result.code, result.message) && !isPublicAuthRequest(config)) {
      redirectToLogin()
    }
    if (isForbiddenCase(result.code, result.message) && !isPublicAuthRequest(config)) {
      redirectToForbidden(result.message)
    }
    throw new Error(result.message || '请求失败')
  }
  return result.data
}
