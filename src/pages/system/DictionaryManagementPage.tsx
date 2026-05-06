import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchTypes(nextQuery)
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="字典管理"
        description="维护系统字典类型和字典项。"
        actions={
          <button className="btn primary" type="button" onClick={openCreateType}>
            <Plus size={18} />
            新建字典
          </button>
        }
      />
      <form className="toolbar" onSubmit={submitSearch}>
        <input
          placeholder="字典编码"
          value={query.dictCode}
          onChange={(event) => setQuery((current) => ({ ...current, dictCode: event.target.value }))}
        />
        <input
          placeholder="字典名称"
          value={query.dictName}
          onChange={(event) => setQuery((current) => ({ ...current, dictName: event.target.value }))}
        />
        <input
          placeholder="模块"
          value={query.module}
          onChange={(event) => setQuery((current) => ({ ...current, module: event.target.value }))}
        />
        <select
          value={query.status}
          onChange={(event) =>
            setQuery((current) => ({ ...current, status: event.target.value === '' ? '' : Number(event.target.value), pageNo: 1 }))
          }
        >
          <option value="">全部状态</option>
          <option value={1}>启用</option>
          <option value={0}>停用</option>
        </select>
        <button className="btn primary" type="submit">
          <Search size={18} />
          查询
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            const nextQuery = { pageNo: 1, pageSize: 10, dictCode: '', dictName: '', module: '', status: '' as number | '' }
            setQuery(nextQuery)
            void fetchTypes(nextQuery)
          }}
        >
          <RefreshCw size={18} />
          重置
        </button>
      </form>
      {error ? <div className="notice error">{error}</div> : null}
      <div className="dictionary-grid">
        <section className="table-panel">
          <div className="section-title">字典类型</div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>编码</th>
                  <th>名称</th>
                  <th>模块</th>
                  <th>状态</th>
                  <th className="actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                {page.records.map((type) => (
                  <tr
                    key={String(type.id)}
                    className={selectedType?.id === type.id ? 'selected-row' : ''}
                    onClick={() => setSelectedType(type)}
                  >
                    <td>
                      <strong>{type.dictCode}</strong>
                    </td>
                    <td>{type.dictName}</td>
                    <td>{type.module}</td>
                    <td>
                      <StatusBadge status={type.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          type="button"
                          title="编辑字典"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditType(type)
                          }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-btn danger"
                          type="button"
                          title="删除字典"
                          onClick={(event) => {
                            event.stopPropagation()
                            void deleteType(type)
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && page.records.length === 0 ? <EmptyState /> : null}
            {loading ? <div className="table-loading">加载中...</div> : null}
          </div>
          <Pagination
            pageNo={page.pageNo}
            pageSize={page.pageSize}
            total={page.total}
            onChange={(pageNo) => setQuery((current) => ({ ...current, pageNo }))}
          />
        </section>
        <section className="table-panel">
          <div className="section-title">
            <span>{selectedType ? `${selectedType.dictName} 的字典项` : '字典项'}</span>
            <button className="btn primary small" type="button" disabled={!selectedType} onClick={openCreateItem}>
              <Plus size={16} />
              新建项
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>值</th>
                  <th>标签</th>
                  <th>排序</th>
                  <th>状态</th>
                  <th className="actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.dictCode}-${item.value}`}>
                    <td>
                      <strong>{item.value}</strong>
                    </td>
                    <td>{item.label}</td>
                    <td>{item.sortOrder ?? 0}</td>
                    <td>
                      <StatusBadge status={item.status ?? 1} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" type="button" title="编辑字典项" onClick={() => openEditItem(item)}>
                          <Pencil size={17} />
                        </button>
                        <button className="icon-btn danger" type="button" title="删除字典项" onClick={() => deleteItem(item)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!itemLoading && items.length === 0 ? <EmptyState text={selectedType ? '暂无字典项' : '请选择字典类型'} /> : null}
            {itemLoading ? <div className="table-loading">加载中...</div> : null}
          </div>
        </section>
      </div>
      <Modal
        title={editingTypeId ? '编辑字典' : '新建字典'}
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setTypeModalOpen(false)}>
              取消
            </button>
            <button
              className="btn primary"
              type="button"
              disabled={saving || !typeForm.dictCode || !typeForm.dictName || !typeForm.module}
              onClick={saveType}
            >
              <Save size={18} />
              保存
            </button>
          </>
        }
      >
        <div className="form-grid two">
          <label className="field">
            <span>字典编码</span>
            <input
              value={typeForm.dictCode}
              disabled={!!editingTypeId}
              onChange={(event) => setTypeForm((current) => ({ ...current, dictCode: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>字典名称</span>
            <input value={typeForm.dictName} onChange={(event) => setTypeForm((current) => ({ ...current, dictName: event.target.value }))} />
          </label>
          <label className="field">
            <span>模块</span>
            <input value={typeForm.module} onChange={(event) => setTypeForm((current) => ({ ...current, module: event.target.value }))} />
          </label>
          <label className="field">
            <span>状态</span>
            <select value={typeForm.status} onChange={(event) => setTypeForm((current) => ({ ...current, status: Number(event.target.value) }))}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </label>
          <label className="field two-span">
            <span>备注</span>
            <input value={typeForm.remark || ''} onChange={(event) => setTypeForm((current) => ({ ...current, remark: event.target.value }))} />
          </label>
        </div>
      </Modal>
      <Modal
        title={editingItemId ? '编辑字典项' : '新建字典项'}
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setItemModalOpen(false)}>
              取消
            </button>
            <button
              className="btn primary"
              type="button"
              disabled={saving || !itemForm.itemValue || !itemForm.itemLabel}
              onClick={saveItem}
            >
              <Save size={18} />
              保存
            </button>
          </>
        }
      >
        <div className="form-grid two">
          <label className="field">
            <span>值</span>
            <input
              value={itemForm.itemValue}
              disabled={!!editingItemId}
              onChange={(event) => setItemForm((current) => ({ ...current, itemValue: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>标签</span>
            <input value={itemForm.itemLabel} onChange={(event) => setItemForm((current) => ({ ...current, itemLabel: event.target.value }))} />
          </label>
          <label className="field">
            <span>排序</span>
            <input
              type="number"
              value={itemForm.sortOrder}
              onChange={(event) => setItemForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            />
          </label>
          <label className="field">
            <span>状态</span>
            <select value={itemForm.status} onChange={(event) => setItemForm((current) => ({ ...current, status: Number(event.target.value) }))}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </label>
          <label className="field two-span">
            <span>备注</span>
            <input value={itemForm.remark || ''} onChange={(event) => setItemForm((current) => ({ ...current, remark: event.target.value }))} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
