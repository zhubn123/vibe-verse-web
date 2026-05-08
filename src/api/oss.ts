import type { IdValue, PageResult } from '@/types/common'
import { requestApi, requestRaw } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface OssObjectQuery {
  pageNo: number
  pageSize: number
  bucket?: string
  originalName?: string
  contentType?: string
  status?: number | ''
}

export interface OssObjectRecord {
  id: IdValue
  bucket: string
  objectKey: string
  originalName: string
  extension?: string
  contentType?: string
  size: number
  checksumSha256?: string
  storageType?: string
  accessPolicy?: string
  status: number
  remark?: string
  downloadUrl?: string
  previewUrl?: string
  createTime?: string
  updateTime?: string
}

export interface OssBlobResult {
  blob: Blob
  filename: string
}

export function queryOssObjectPage(params: OssObjectQuery): Promise<PageResult<OssObjectRecord>> {
  return requestApi<PageResult<OssObjectRecord>>({
    url: '/oss-objects',
    method: 'get',
    params
  })
}

export function getOssObjectDetailApi(id: IdValue): Promise<OssObjectRecord> {
  return requestApi<OssObjectRecord>({
    url: `/oss-objects/${id}`,
    method: 'get'
  })
}

export function uploadOssObjectApi(data: { file: File; bucket?: string; remark?: string }): Promise<OssObjectRecord> {
  const formData = new FormData()
  formData.append('file', data.file)
  if (data.bucket) {
    formData.append('bucket', data.bucket)
  }
  if (data.remark) {
    formData.append('remark', data.remark)
  }
  return requestApi<OssObjectRecord>({
    url: '/oss-objects',
    method: 'post',
    data: formData
  })
}

export async function downloadOssObjectApi(id: IdValue, inline = false): Promise<OssBlobResult> {
  const response = await requestRaw<Blob>({
    url: `/oss-objects/${id}/${inline ? 'preview' : 'download'}`,
    method: 'get',
    responseType: 'blob'
  })
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

export async function deleteOssObjectsApi(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/oss-objects?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
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
