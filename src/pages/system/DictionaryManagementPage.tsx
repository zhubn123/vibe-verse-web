import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createDictionaryItem,
  createDictionaryType,
  queryDictionaryItems,
  queryDictionaryTypePage,
  removeDictionaryItems,
  removeDictionaryTypes,
  updateDictionaryItem,
  updateDictionaryType,
  type DictionaryItemSaveRequest,
  type DictionaryTypeSaveRequest
} from '@/api/dictionary'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { IdValue, PageResult } from '@/types/common'
import type { DictionaryItem, DictionaryType } from '@/types/dictionary'

const emptyTypeForm: DictionaryTypeSaveRequest = {
  dictCode: '',
  dictName: '',
  module: 'system',
  status: 1,
  remark: ''
}

const emptyItemForm: DictionaryItemSaveRequest = {
  itemValue: '',
  itemLabel: '',
  sortOrder: 0,
  status: 1,
  remark: ''
}

const ALL_STATUS_VALUE = '__all_status__'

export default function DictionaryManagementPage() {
  const [query, setQuery] = useState({ pageNo: 1, pageSize: 10, dictCode: '', dictName: '', module: '', status: '' as number | '' })
  const [page, setPage] = useState<PageResult<DictionaryType>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [selectedType, setSelectedType] = useState<DictionaryType | null>(null)
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingTypeId, setEditingTypeId] = useState<IdValue | null>(null)
  const [editingItemId, setEditingItemId] = useState<IdValue | null>(null)
  const [typeForm, setTypeForm] = useState<DictionaryTypeSaveRequest>(emptyTypeForm)
  const [itemForm, setItemForm] = useState<DictionaryItemSaveRequest>(emptyItemForm)
  const [loading, setLoading] = useState(false)
  const [itemLoading, setItemLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedCode = useMemo(() => selectedType?.dictCode || '', [selectedType])

  useEffect(() => {
    void fetchTypes()
  }, [query.pageNo, query.pageSize, query.status])

  useEffect(() => {
    if (selectedCode) {
      void fetchItems(selectedCode)
    } else {
      setItems([])
    }
  }, [selectedCode])

  async function fetchTypes(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryDictionaryTypePage({
        ...nextQuery,
        dictCode: nextQuery.dictCode || undefined,
        dictName: nextQuery.dictName || undefined,
        module: nextQuery.module || undefined,
        status: nextQuery.status === '' ? undefined : nextQuery.status
      })
      setPage(result)
      setSelectedType((current) => {
        if (!result.records.length) {
          return null
        }
        if (!current) {
          return result.records[0]
        }
        return result.records.find((item) => item.id === current.id) || result.records[0]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载字典失败')
    } finally {
      setLoading(false)
    }
  }

  async function fetchItems(dictCode: string) {
    setItemLoading(true)
    setError('')
    try {
      const result = await queryDictionaryItems(dictCode, true)
      setItems(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载字典项失败')
    } finally {
      setItemLoading(false)
    }
  }

  function openCreateType() {
    setEditingTypeId(null)
    setTypeForm(emptyTypeForm)
    setTypeModalOpen(true)
  }

  function openEditType(type: DictionaryType) {
    setEditingTypeId(type.id)
    setTypeForm({
      dictCode: type.dictCode,
      dictName: type.dictName,
      module: type.module,
      status: type.status,
      remark: type.remark || ''
    })
    setTypeModalOpen(true)
  }

  function openCreateItem() {
    setEditingItemId(null)
    setItemForm(emptyItemForm)
    setItemModalOpen(true)
  }

  function openEditItem(item: DictionaryItem) {
    setEditingItemId(item.id || null)
    setItemForm({
      itemValue: item.value,
      itemLabel: item.label,
      sortOrder: item.sortOrder || 0,
      status: item.status ?? 1,
      remark: item.remark || ''
    })
    setItemModalOpen(true)
  }

  async function saveType() {
    setSaving(true)
    setError('')
    try {
      if (editingTypeId) {
        await updateDictionaryType(editingTypeId, typeForm)
      } else {
        await createDictionaryType(typeForm)
      }
      setTypeModalOpen(false)
      await fetchTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存字典类型失败')
    } finally {
      setSaving(false)
    }
  }

  async function saveItem() {
    if (!selectedType) {
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingItemId) {
        await updateDictionaryItem(editingItemId, itemForm)
      } else {
        await createDictionaryItem(selectedType.dictCode, itemForm)
      }
      setItemModalOpen(false)
      await fetchItems(selectedType.dictCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存字典项失败')
    } finally {
      setSaving(false)
    }
  }

  async function deleteType(type: DictionaryType) {
    if (!window.confirm(`确认删除字典 ${type.dictName}？`)) {
      return
    }
    setError('')
    try {
      await removeDictionaryTypes([type.id])
      await fetchTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除字典类型失败')
    }
  }

  async function deleteItem(item: DictionaryItem) {
    if (!item.id || !window.confirm(`确认删除字典项 ${item.label}？`)) {
      return
    }
    setError('')
    try {
      await removeDictionaryItems([item.id])
      if (selectedType) {
        await fetchItems(selectedType.dictCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除字典项失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchTypes(nextQuery)
  }

  function resetSearch() {
    const nextQuery = { pageNo: 1, pageSize: 10, dictCode: '', dictName: '', module: '', status: '' as number | '' }
    setQuery(nextQuery)
    void fetchTypes(nextQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="字典管理"
        description="维护系统字典类型和字典项。"
        actions={
          <Button type="button" onClick={openCreateType}>
            <Plus />
            新建字典
          </Button>
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_180px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="dict-search-code">字典编码</Label>
              <Input
                id="dict-search-code"
                placeholder="请输入字典编码"
                value={query.dictCode}
                onChange={(event) => setQuery((current) => ({ ...current, dictCode: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dict-search-name">字典名称</Label>
              <Input
                id="dict-search-name"
                placeholder="请输入字典名称"
                value={query.dictName}
                onChange={(event) => setQuery((current) => ({ ...current, dictName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dict-search-module">模块</Label>
              <Input
                id="dict-search-module"
                placeholder="system"
                value={query.module}
                onChange={(event) => setQuery((current) => ({ ...current, module: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={query.status === '' ? ALL_STATUS_VALUE : String(query.status)}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    status: value === ALL_STATUS_VALUE ? '' : Number(value),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>全部状态</SelectItem>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
              <Button className="flex-1 xl:flex-none" type="submit">
                <Search />
                查询
              </Button>
              <Button className="flex-1 xl:flex-none" variant="outline" type="button" onClick={resetSearch}>
                <RefreshCw />
                重置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-slate-50/70">
            <CardTitle className="text-base">字典类型</CardTitle>
            <Badge variant="outline" className="bg-background text-muted-foreground">
              {page.total} 条
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/90">
                <TableRow className="hover:bg-slate-50/90">
                  <TableHead className="min-w-36">编码</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-28">模块</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-28 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.records.map((type) => (
                  <TableRow
                    key={String(type.id)}
                    className={selectedType?.id === type.id ? 'cursor-pointer bg-blue-50/70 hover:bg-blue-50' : 'cursor-pointer'}
                    onClick={() => setSelectedType(type)}
                  >
                    <TableCell>
                      <span className="font-medium text-foreground">{type.dictCode}</span>
                    </TableCell>
                    <TableCell>{type.dictName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-muted-foreground">
                        {type.module}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={type.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          title="编辑字典"
                          aria-label="编辑字典"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditType(type)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          title="删除字典"
                          aria-label="删除字典"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation()
                            void deleteType(type)
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!loading && page.records.length === 0 ? <EmptyState /> : null}
            {loading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
            <Pagination
              pageNo={page.pageNo}
              pageSize={page.pageSize}
              total={page.total}
              onChange={(pageNo) => setQuery((current) => ({ ...current, pageNo }))}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-slate-50/70">
            <div>
              <CardTitle className="text-base">{selectedType ? `${selectedType.dictName} 的字典项` : '字典项'}</CardTitle>
              {selectedType ? <p className="mt-1 text-xs text-muted-foreground">{selectedType.dictCode}</p> : null}
            </div>
            <Button size="sm" type="button" disabled={!selectedType} onClick={openCreateItem}>
              <Plus />
              新建项
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/90">
                <TableRow className="hover:bg-slate-50/90">
                  <TableHead className="min-w-32">值</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead className="w-20">排序</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-28 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.dictCode}-${item.value}`}>
                    <TableCell>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sortOrder ?? 0}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status ?? 1} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" type="button" title="编辑字典项" aria-label="编辑字典项" onClick={() => openEditItem(item)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          title="删除字典项"
                          aria-label="删除字典项"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteItem(item)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!itemLoading && items.length === 0 ? <EmptyState text={selectedType ? '暂无字典项' : '请选择字典类型'} /> : null}
            {itemLoading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
          </CardContent>
        </Card>
      </div>

      <Modal
        title={editingTypeId ? '编辑字典' : '新建字典'}
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setTypeModalOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={saving || !typeForm.dictCode || !typeForm.dictName || !typeForm.module}
              onClick={saveType}
            >
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dict-type-code">字典编码</Label>
            <Input
              id="dict-type-code"
              value={typeForm.dictCode}
              disabled={!!editingTypeId}
              onChange={(event) => setTypeForm((current) => ({ ...current, dictCode: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dict-type-name">字典名称</Label>
            <Input
              id="dict-type-name"
              value={typeForm.dictName}
              onChange={(event) => setTypeForm((current) => ({ ...current, dictName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dict-type-module">模块</Label>
            <Input
              id="dict-type-module"
              value={typeForm.module}
              onChange={(event) => setTypeForm((current) => ({ ...current, module: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={String(typeForm.status)} onValueChange={(value) => setTypeForm((current) => ({ ...current, status: Number(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dict-type-remark">备注</Label>
            <Input
              id="dict-type-remark"
              value={typeForm.remark || ''}
              onChange={(event) => setTypeForm((current) => ({ ...current, remark: event.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={editingItemId ? '编辑字典项' : '新建字典项'}
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setItemModalOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={saving || !itemForm.itemValue || !itemForm.itemLabel}
              onClick={saveItem}
            >
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dict-item-value">值</Label>
            <Input
              id="dict-item-value"
              value={itemForm.itemValue}
              disabled={!!editingItemId}
              onChange={(event) => setItemForm((current) => ({ ...current, itemValue: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dict-item-label">标签</Label>
            <Input
              id="dict-item-label"
              value={itemForm.itemLabel}
              onChange={(event) => setItemForm((current) => ({ ...current, itemLabel: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dict-item-sort">排序</Label>
            <Input
              id="dict-item-sort"
              type="number"
              value={itemForm.sortOrder}
              onChange={(event) => setItemForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={String(itemForm.status)} onValueChange={(value) => setItemForm((current) => ({ ...current, status: Number(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dict-item-remark">备注</Label>
            <Input
              id="dict-item-remark"
              value={itemForm.remark || ''}
              onChange={(event) => setItemForm((current) => ({ ...current, remark: event.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
