import type { IdValue, PageResult } from '@/types/common'
import { requestApi } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface RoleManagementQuery {
  pageNo: number
  pageSize: number
  roleKey?: string
  roleName?: string
  status?: number | ''
}

export interface RoleRecord {
  id: IdValue
  roleKey: string
  roleName: string
  status: number
  remark?: string
  builtIn: boolean
  modifiable: boolean
  deletable: boolean
  userCount: number
  permissionCount: number
  permissionKeys: string[]
  permissionNames: string[]
}

export interface RoleOption {
  id: IdValue
  roleKey: string
  roleName: string
  status: number
  builtIn: boolean
  modifiable: boolean
  permissionKeys: string[]
  permissionNames: string[]
}

export interface PermissionOption {
  id: IdValue
  permKey: string
  permName: string
  module: string
  moduleName: string
  action: string
  status: number
  remark?: string
}

export interface PermissionGroup {
  module: string
  moduleName: string
  permissions: PermissionOption[]
}

export interface RoleSaveRequest {
  roleKey: string
  roleName: string
  status: number
  remark?: string
  permissionKeys: string[]
}

export function queryRolePage(params: RoleManagementQuery): Promise<PageResult<RoleRecord>> {
  return requestApi<PageResult<RoleRecord>>({
    url: '/roles',
    method: 'get',
    params
  })
}

export function getRoleDetailApi(roleId: IdValue): Promise<RoleRecord> {
  return requestApi<RoleRecord>({
    url: `/roles/${roleId}`,
    method: 'get'
  })
}

export function queryRoleOptionsApi(): Promise<RoleOption[]> {
  return requestApi<RoleOption[]>({
    url: '/roles/options',
    method: 'get'
  })
}

export async function createRoleApi(data: RoleSaveRequest): Promise<void> {
  await requestApi<void>({
    url: '/roles',
    method: 'post',
    data
  })
}

export async function updateRoleApi(roleId: IdValue, data: RoleSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/roles/${roleId}`,
    method: 'put',
    data
  })
}

export async function deleteRolesApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/roles?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function listPermissionCatalogApi(): Promise<PermissionGroup[]> {
  return requestApi<PermissionGroup[]>({
    url: '/permissions',
    method: 'get'
  })
}
