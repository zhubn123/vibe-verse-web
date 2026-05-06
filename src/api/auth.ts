import { requestApi } from '@/utils/request'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
  nickname?: string
  phone?: string
}

export interface UserInfo {
  id: string
  username: string
  nickname?: string
  email?: string
  phone?: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  userInfo: UserInfo
  roles: string[]
}

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const result = await requestApi<{
    token: string
    refreshToken?: string
    userInfo: {
      id: number | string
      username: string
      nickname?: string
      email?: string
      phone?: string
    }
    roles?: string[]
  }>({
    url: '/auth/login',
    method: 'post',
    data,
    skipAuthRefresh: true
  })

  return {
    token: result.token,
    refreshToken: result.refreshToken,
    userInfo: {
      id: String(result.userInfo.id),
      username: result.userInfo.username,
      nickname: result.userInfo.nickname,
      email: result.userInfo.email,
      phone: result.userInfo.phone
    },
    roles: result.roles || []
  }
}

export async function registerApi(data: RegisterRequest): Promise<string> {
  const userId = await requestApi<number | string>({
    url: '/auth/register',
    method: 'post',
    data,
    skipAuthRefresh: true
  })
  return String(userId)
}

export async function logoutApi(): Promise<void> {
  await requestApi<void>({
    url: '/auth/logout',
    method: 'post',
    skipAuthRefresh: true
  })
}
