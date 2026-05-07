import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createSystemConfigApi,
  deleteSystemConfigsApi,
  getSystemConfigDetailApi,
  querySystemConfigPage,
  updateSystemConfigApi,
  type SystemConfigQuery,
  type SystemConfigRecord,
  type SystemConfigSaveRequest
} from '@/api/system'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useAuth } from '@/context/AuthContext'
import type { IdValue, PageResult } from '@/types/common'

const ALL_STATUS_VALUE = '__all_status__'

const defaultQuery: SystemConfigQuery = {
  pageNo: 1,
  pageSize: 10,
  configKey: '',
  configName: '',
  status: ''
}

const emptyForm: SystemConfigSaveRequest = {
  configKey: '',
  configName: '',
  configValue: '',
  valueType: 'text',
  status: 0,
  remark: ''
}

function ConfigStatusBadge({ status }: { status: number | undefined }) {
  const enabled = Number(status) === 0
  return <Badge variant={enabled ? 'success' : 'muted'}>{enabled ? '正常' : '停用'}</Badge>
}

export default function SystemConfigPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission('system:config:manage')
  const [query, setQuery] = useState<SystemConfigQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<SystemConfigRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [editingId, setEditingId] = useState<IdValue | null>(null)
  const [form, setForm] = useState<SystemConfigSaveRequest>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchConfigs()
  }, [query.pageNo, query.pageSize, query.status])

  async function fetchConfigs(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await querySystemConfigPage({
        ...nextQuery,
        configKey: nextQuery.configKey || undefined,
        configName: nextQuery.configName || undefined,
        status: nextQuery.status === '' ? undefined : nextQuery.status
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载系统参数失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  async function openEdit(config: SystemConfigRecord) {
    setError('')
    try {
      const detail = await getSystemConfigDetailApi(config.id)
      setEditingId(detail.id)
      setForm({
        configKey: detail.configKey,
        configName: detail.configName,
        configValue: detail.configValue || '',
        valueType: detail.valueType || 'text',
        status: detail.status,
        remark: detail.remark || ''
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载参数详情失败')
    }
  }

  function updateForm(field: keyof SystemConfigSaveRequest, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveConfig() {
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateSystemConfigApi(editingId, form)
      } else {
        await createSystemConfigApi(form)
      }
      setModalOpen(false)
      await fetchConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存系统参数失败')
    } finally {
      setSaving(false)
    }
  }

  async function deleteConfig(config: SystemConfigRecord) {
    if (!window.confirm(`确认删除系统参数 ${config.configName}？`)) {
      return
    }
    setError('')
    try {
      await deleteSystemConfigsApi([config.id])
      await fetchConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除系统参数失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchConfigs(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchConfigs(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="系统参数"
        description="维护系统级配置项和模块参数。"
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <Plus />
              新建参数
            </Button>
          ) : null
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="config-search-key">配置键</Label>
              <Input
                id="config-search-key"
                placeholder="请输入配置键"
                value={query.configKey}
                onChange={(event) => setQuery((current) => ({ ...current, configKey: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-search-name">配置名称</Label>
              <Input
                id="config-search-name"
                placeholder="请输入配置名称"
                value={query.configName}
                onChange={(event) => setQuery((current) => ({ ...current, configName: event.target.value }))}
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
                  <SelectItem value="0">正常</SelectItem>
                  <SelectItem value="1">停用</SelectItem>
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

      <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/90">
            <TableRow className="hover:bg-slate-50/90">
              <TableHead className="min-w-44">配置键</TableHead>
              <TableHead className="min-w-36">配置名称</TableHead>
              <TableHead className="min-w-56">配置值</TableHead>
              <TableHead className="w-28">值类型</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-48">备注</TableHead>
              {canManage ? <TableHead className="w-28 text-right">操作</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((config) => (
              <TableRow key={String(config.id)}>
                <TableCell>
                  <span className="font-medium text-foreground">{config.configKey}</span>
                </TableCell>
                <TableCell>{config.configName}</TableCell>
                <TableCell className="max-w-96 truncate font-mono text-xs text-muted-foreground">{config.configValue || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-muted-foreground">
                    {config.valueType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfigStatusBadge status={config.status} />
                </TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground">{config.remark || '-'}</TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" type="button" title="编辑参数" aria-label="编辑参数" onClick={() => openEdit(config)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        title="删除参数"
                        aria-label="删除参数"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteConfig(config)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
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
      </Card>

      <Modal
        title={editingId ? '编辑系统参数' : '新建系统参数'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={saving || !form.configKey || !form.configName || !form.valueType} onClick={saveConfig}>
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="config-form-key">配置键</Label>
            <Input
              id="config-form-key"
              value={form.configKey}
              disabled={!!editingId}
              onChange={(event) => updateForm('configKey', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config-form-name">配置名称</Label>
            <Input id="config-form-name" value={form.configName} onChange={(event) => updateForm('configName', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>值类型</Label>
            <Select value={form.valueType} onValueChange={(value) => updateForm('valueType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">文本</SelectItem>
                <SelectItem value="number">数字</SelectItem>
                <SelectItem value="boolean">布尔</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={String(form.status)} onValueChange={(value) => updateForm('status', Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">正常</SelectItem>
                <SelectItem value="1">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="config-form-value">配置值</Label>
            <textarea
              id="config-form-value"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              value={form.configValue || ''}
              onChange={(event) => updateForm('configValue', event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="config-form-remark">备注</Label>
            <Input id="config-form-remark" value={form.remark || ''} onChange={(event) => updateForm('remark', event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
