import type { IdValue, PageResult } from '@/types/common'
import { requestApi } from '@/utils/request'

export interface ProfileInfo {
  id: string
  username: string
  email?: string
  nickname?: string
  phone?: string
}

export interface UserManagementQuery {
  pageNo: number
  pageSize: number
  username?: string
  nickname?: string
  roleKey?: string
  status?: number | ''
}

export interface ManagedUser {
  id: IdValue
  username: string
  nickname?: string
  email?: string
  phone?: string
  status: number
  lastLoginTime?: string
  roles: string[]
  permissionKeys: string[]
  permissionNames: string[]
  immutable: boolean
}

export interface ManagedUserUpdateRequest {
  nickname?: string
  email?: string
  phone?: string
  status: number
  roleKeys: string[]
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export async function getProfileApi(): Promise<ProfileInfo> {
  const result = await requestApi<{
    id: number | string
    username: string
    nickname?: string
    email?: string
    phone?: string
  }>({
    url: '/users/profile',
    method: 'get'
  })
  return {
    id: String(result.id),
    username: result.username,
    nickname: result.nickname,
    email: result.email,
    phone: result.phone
  }
}

export async function updateProfileApi(data: Partial<ProfileInfo>): Promise<void> {
  await requestApi<void>({
    url: '/users/profile',
    method: 'put',
    data
  })
}

export async function updatePasswordApi(data: ChangePasswordRequest): Promise<void> {
  await requestApi<void>({
    url: '/users/password',
    method: 'put',
    data
  })
}

export function queryUserPage(params: UserManagementQuery): Promise<PageResult<ManagedUser>> {
  return requestApi<PageResult<ManagedUser>>({
    url: '/users/page',
    method: 'get',
    params
  })
}

export async function updateManagedUserApi(userId: IdValue, data: ManagedUserUpdateRequest): Promise<void> {
  await requestApi<void>({
    url: `/users/${userId}`,
    method: 'put',
    data
  })
}
