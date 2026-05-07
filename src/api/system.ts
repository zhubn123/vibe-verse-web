import type { IdValue, PageResult } from '@/types/common'
import { requestApi } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
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
