import type { IdValue, PageResult } from '@/types/common'
import { requestApi } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export type ReminderStatus = 'PENDING' | 'DONE' | 'CANCELLED'

export interface ReminderQuery {
  pageNo: number
  pageSize: number
  title?: string
  status?: ReminderStatus | ''
  dueOnly?: boolean
}

export interface ReminderRecord {
  id: IdValue
  title: string
  content?: string
  remindTime: string
  status: ReminderStatus
  due: boolean
  doneTime?: string
  cancelTime?: string
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface ReminderSaveRequest {
  title: string
  content?: string
  remindTime: string
  remark?: string
}

export function queryReminderPage(params: ReminderQuery): Promise<PageResult<ReminderRecord>> {
  return requestApi<PageResult<ReminderRecord>>({
    url: '/reminders',
    method: 'get',
    params
  })
}

export function getReminderDetailApi(id: IdValue): Promise<ReminderRecord> {
  return requestApi<ReminderRecord>({
    url: `/reminders/${id}`,
    method: 'get'
  })
}

export function countDueRemindersApi(): Promise<{ count: number }> {
  return requestApi<{ count: number }>({
    url: '/reminders/due-count',
    method: 'get'
  })
}

export async function createReminderApi(data: ReminderSaveRequest): Promise<void> {
  await requestApi<void>({
    url: '/reminders',
    method: 'post',
    data
  })
}

export async function updateReminderApi(id: IdValue, data: ReminderSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/reminders/${id}`,
    method: 'put',
    data
  })
}

export async function completeReminderApi(id: IdValue): Promise<void> {
  await requestApi<void>({
    url: `/reminders/${id}/complete`,
    method: 'put'
  })
}

export async function cancelReminderApi(id: IdValue): Promise<void> {
  await requestApi<void>({
    url: `/reminders/${id}/cancel`,
    method: 'put'
  })
}

export async function deleteRemindersApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/reminders?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}
