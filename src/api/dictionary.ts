import type { IdValue, PageResult } from '@/types/common'
import type { DictionaryItem, DictionaryOption, DictionaryType } from '@/types/dictionary'
import { requestApi } from '@/utils/request'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface DictionaryTypeQuery {
  pageNo?: number
  pageSize?: number
  dictCode?: string
  dictName?: string
  module?: string
  status?: number | ''
}

export interface DictionaryTypeSaveRequest {
  dictCode: string
  dictName: string
  module: string
  status: number
  remark?: string
}

export interface DictionaryItemSaveRequest {
  itemValue: string
  itemLabel: string
  sortOrder: number
  status: number
  remark?: string
}

export function queryDictionaryTypePage(query: DictionaryTypeQuery): Promise<PageResult<DictionaryType>> {
  return requestApi<PageResult<DictionaryType>>({
    url: '/dictionaries',
    method: 'get',
    params: query
  })
}

export function getDictionaryTypeDetail(id: IdValue): Promise<DictionaryType> {
  return requestApi<DictionaryType>({
    url: `/dictionaries/${id}`,
    method: 'get'
  })
}

export function queryDictionaryItems(dictCode: string, includeDisabled = false): Promise<DictionaryItem[]> {
  return requestApi<DictionaryItem[]>({
    url: `/dictionaries/${encodeURIComponent(dictCode)}/items`,
    method: 'get',
    params: { includeDisabled }
  })
}

export async function queryDictionaryOptions<T extends string = string>(
  dictCode: string
): Promise<Array<DictionaryOption<T>>> {
  const items = await queryDictionaryItems(dictCode)
  return items.map((item) => ({
    value: item.value as T,
    label: item.label,
    sortOrder: item.sortOrder,
    remark: item.remark
  }))
}

export async function createDictionaryType(data: DictionaryTypeSaveRequest): Promise<void> {
  await requestApi<void>({
    url: '/dictionaries',
    method: 'post',
    data
  })
}

export async function updateDictionaryType(id: IdValue, data: DictionaryTypeSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/dictionaries/${id}`,
    method: 'put',
    data
  })
}

export async function removeDictionaryTypes(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/dictionaries?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export async function createDictionaryItem(dictCode: string, data: DictionaryItemSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/dictionaries/${encodeURIComponent(dictCode)}/items`,
    method: 'post',
    data
  })
}

export async function updateDictionaryItem(id: IdValue, data: DictionaryItemSaveRequest): Promise<void> {
  await requestApi<void>({
    url: `/dictionaries/items/${id}`,
    method: 'put',
    data
  })
}

export async function removeDictionaryItems(ids: IdValue[]): Promise<void> {
  await requestApi<void>({
    url: `/dictionaries/items?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export function resolveDictionaryLabel(
  options: Array<DictionaryOption<string>>,
  value: string | number | undefined,
  fallback = '-'
): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const normalizedValue = String(value)
  return options.find((item) => item.value === normalizedValue)?.label || fallback
}
