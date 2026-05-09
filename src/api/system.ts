import type { IdValue, PageResult } from '@/types/common'
import { requestApi } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface MenuItem {
  id: IdValue
  parentId: IdValue
  menuKey: string
  title: string
  path?: string
  icon?: string
  permissionKey?: string
  sortOrder?: number
  children?: MenuItem[]
}

export interface MenuManageRecord {
  id: IdValue
  parentId: IdValue
  menuKey: string
  title: string
  path?: string
  icon?: string
  permissionKey?: string
  sortOrder: number
  visible: number
  status: number
  remark?: string
  children?: MenuManageRecord[]
}

export interface MenuSaveRequest {
  parentId: number
  menuKey: string
  title: string
  path?: string
  icon?: string
  permissionKey?: string
  sortOrder: number
  visible: number
  status: number
  remark?: string
}

export interface AuditLogQuery {
  pageNo: number
  pageSize: number
  username?: string
  eventType?: string
  eventName?: string
  result?: number | ''
  startTime?: string
  endTime?: string
}

export interface AuditLogRecord {
  id: IdValue
  userId?: IdValue
  username?: string
  eventType?: string
  eventName?: string
  requestUri?: string
  clientIp?: string
  result?: number
  message?: string
  occurTime?: string
}

export interface SystemConfigQuery {
  pageNo: number
  pageSize: number
  configKey?: string
  configName?: string
  status?: number | ''
}

export interface SystemConfigRecord {
  id: IdValue
  configKey: string
  configName: string
  configValue?: string
  valueType: string
  status: number
  remark?: string
}

export interface SystemConfigSaveRequest {
  configKey: string
  configName: string
  configValue?: string
  valueType: string
  status: number
  remark?: string
}

export interface AppConfig {
  platformName: string
}

export function getAppConfigApi(): Promise<AppConfig> {
  return requestApi<AppConfig>({
    url: '/app-config',
    method: 'get',
    skipAuthRefresh: true
  })
}

export function queryAuditLogPage(params: AuditLogQuery): Promise<PageResult<AuditLogRecord>> {
  return requestApi<PageResult<AuditLogRecord>>({
    url: '/audit-logs',
    method: 'get',
    params
  })
}

export function querySystemConfigPage(params: SystemConfigQuery): Promise<PageResult<SystemConfigRecord>> {
  return requestApi<PageResult<SystemConfigRecord>>({
    url: '/system-configs',
    method: 'get',
    params
  })
}

export function getSystemConfigDetailApi(id: IdValue): Promise<SystemConfigRecord> {
  return requestApi<SystemConfigRecord>({
    url: `/system-configs/${id}`,
    method: 'get'
  })
}

export async function createSystemConfigApi(data: SystemConfigSaveRequest): Promise<void> {
  await requestApi<void>({
    url: '/system-configs',
    method: 'post',
    data
  })
}

export async function updateSystemConfigApi(id: IdValue, data: SystemConfigSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/system-configs/${id}`,
    method: 'put',
    data
  })
}

export async function deleteSystemConfigsApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/system-configs?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function listCurrentMenusApi(): Promise<MenuItem[]> {
  return requestApi<MenuItem[]>({
    url: '/menus/current',
    method: 'get'
  })
}

export function listMenuTreeApi(): Promise<MenuManageRecord[]> {
  return requestApi<MenuManageRecord[]>({
    url: '/menus',
    method: 'get'
  })
}

export function getMenuDetailApi(id: IdValue): Promise<MenuManageRecord> {
  return requestApi<MenuManageRecord>({
    url: `/menus/${id}`,
    method: 'get'
  })
}

export async function createMenuApi(data: MenuSaveRequest): Promise<void> {
  await requestApi<void>({
    url: '/menus',
    method: 'post',
    data
  })
}

export async function updateMenuApi(id: IdValue, data: MenuSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/menus/${id}`,
    method: 'put',
    data
  })
}

export async function deleteMenusApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/menus?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}
