import type { IdValue, PageResult } from '@/types/common'
import { requestApi, requestRaw } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export type DataExchangeDirection = 'IMPORT' | 'EXPORT'
export type DataExchangeStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

export interface DataExchangeTaskQuery {
  pageNo: number
  pageSize: number
  direction?: DataExchangeDirection | ''
  scene?: string
  status?: DataExchangeStatus | ''
}

export interface DataExchangeTaskRecord {
  id: IdValue
  direction: DataExchangeDirection
  scene: string
  status: DataExchangeStatus
  sourceObjectId?: IdValue
  resultObjectId?: IdValue
  errorObjectId?: IdValue
  totalCount: number
  successCount: number
  failCount: number
  message?: string
  remark?: string
  sourceDownloadUrl?: string
  resultDownloadUrl?: string
  errorDownloadUrl?: string
  startTime?: string
  finishTime?: string
  createTime?: string
  updateTime?: string
}

export function queryDataExchangeTaskPage(params: DataExchangeTaskQuery): Promise<PageResult<DataExchangeTaskRecord>> {
  return requestApi<PageResult<DataExchangeTaskRecord>>({
    url: '/data-exchange-tasks',
    method: 'get',
    params
  })
}

export async function deleteDataExchangeTasksApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/data-exchange-tasks?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export interface FileResult {
  blob: Blob
  filename: string
}

export async function downloadTemplateApi(scene: string): Promise<FileResult> {
  return requestFile({
    url: `/data-exchange/templates/${scene}`,
    method: 'get',
    responseType: 'blob'
  })
}

export function importBySceneApi(scene: string, file: File, remark?: string): Promise<DataExchangeTaskRecord> {
  const formData = new FormData()
  formData.append('file', file)
  if (remark) {
    formData.append('remark', remark)
  }
  return requestApi<DataExchangeTaskRecord>({
    url: `/data-exchange/import/${scene}`,
    method: 'post',
    data: formData
  })
}

export async function exportBySceneApi(scene: string, params?: Record<string, unknown>): Promise<FileResult> {
  return requestFile({
    url: `/data-exchange/export/${scene}`,
    method: 'get',
    params,
    responseType: 'blob'
  })
}

async function requestFile(config: Parameters<typeof requestRaw>[0]): Promise<FileResult> {
  const response = await requestRaw<Blob>(config)
  const contentType = String(response.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const text = await response.data.text()
    try {
      const result = JSON.parse(text) as { message?: string }
      throw new Error(result.message || '文件请求失败')
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error
      }
      throw new Error('文件请求失败')
    }
  }
  return {
    blob: response.data,
    filename: resolveFilename(response.headers['content-disposition'])
  }
}

function resolveFilename(contentDisposition: unknown): string {
  if (!contentDisposition || typeof contentDisposition !== 'string') {
    return ''
  }
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] || ''
}
