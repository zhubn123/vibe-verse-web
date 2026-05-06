import type { IdValue } from './common'

export interface DictionaryType {
  id: IdValue
  dictCode: string
  dictName: string
  module: string
  status: number
  itemCount: number
  remark?: string
  items?: DictionaryItem[]
}

export interface DictionaryItem {
  id?: IdValue
  dictCode: string
  value: string
  label: string
  sortOrder?: number
  status?: number
  remark?: string
}

export interface DictionaryOption<T extends string = string> {
  value: T
  label: string
  sortOrder?: number
  remark?: string
}
