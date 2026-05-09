import { Download, FileUp, FileWarning, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  deleteDataExchangeTasksApi,
  queryDataExchangeTaskPage,
  type DataExchangeDirection,
  type DataExchangeStatus,
  type DataExchangeTaskQuery,
  type DataExchangeTaskRecord
} from '@/api/data-exchange'
import { downloadOssObjectApi } from '@/api/oss'
import EmptyState from '@/components/EmptyState'
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

const ALL_DIRECTION_VALUE = '__all_direction__'
const ALL_STATUS_VALUE = '__all_status__'

const defaultQuery: DataExchangeTaskQuery = {
  pageNo: 1,
  pageSize: 10,
  direction: '',
  scene: '',
  status: ''
}

const statusLabels: Record<DataExchangeStatus, string> = {
  PENDING: '待处理',
  RUNNING: '处理中',
  SUCCESS: '成功',
  FAILED: '失败'
}

const directionLabels: Record<DataExchangeDirection, string> = {
  IMPORT: '导入',
  EXPORT: '导出'
}

function StatusBadge({ status }: { status: DataExchangeStatus }) {
  const variant = status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'destructive' : status === 'RUNNING' ? 'secondary' : 'muted'
  return <Badge variant={variant}>{statusLabels[status] || status}</Badge>
}

export default function DataExchangeTaskPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission('system:exchange:manage')
  const [query, setQuery] = useState<DataExchangeTaskQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<DataExchangeTaskRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchTasks()
  }, [query.pageNo, query.pageSize, query.direction, query.status])

  async function fetchTasks(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryDataExchangeTaskPage({
        ...nextQuery,
        direction: nextQuery.direction || undefined,
        scene: nextQuery.scene || undefined,
        status: nextQuery.status || undefined
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载导入导出任务失败')
    } finally {
      setLoading(false)
    }
  }

  async function downloadObject(objectId: IdValue | undefined, fallbackName: string) {
    if (!objectId) {
      return
    }
    setError('')
    try {
      const result = await downloadOssObjectApi(objectId)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename || fallbackName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载文件失败')
    }
  }

  async function deleteTask(record: DataExchangeTaskRecord) {
    if (!window.confirm(`确认删除任务 ${record.id}？`)) {
      return
    }
    setError('')
    try {
      await deleteDataExchangeTasksApi([record.id])
      await fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchTasks(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchTasks(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="导入导出记录" description="查看业务页面发起的导入导出任务、处理结果和错误明细。" />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_minmax(0,1fr)_150px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label>方向</Label>
              <Select
                value={query.direction || ALL_DIRECTION_VALUE}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    direction: value === ALL_DIRECTION_VALUE ? '' : (value as DataExchangeDirection),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_DIRECTION_VALUE}>全部</SelectItem>
                  <SelectItem value="IMPORT">导入</SelectItem>
                  <SelectItem value="EXPORT">导出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-search-scene">场景</Label>
              <Input
                id="exchange-search-scene"
                value={query.scene}
                placeholder="请输入场景标识"
                onChange={(event) => setQuery((current) => ({ ...current, scene: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={query.status || ALL_STATUS_VALUE}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    status: value === ALL_STATUS_VALUE ? '' : (value as DataExchangeStatus),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>全部</SelectItem>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="RUNNING">处理中</SelectItem>
                  <SelectItem value="SUCCESS">成功</SelectItem>
                  <SelectItem value="FAILED">失败</SelectItem>
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
              <TableHead className="min-w-32">任务</TableHead>
              <TableHead className="min-w-40">场景</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-36">记录数</TableHead>
              <TableHead className="min-w-56">消息</TableHead>
              <TableHead className="min-w-40">创建时间</TableHead>
              <TableHead className="min-w-36 text-right">文件</TableHead>
              {canManage ? <TableHead className="w-20 text-right">操作</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((record) => (
              <TableRow key={String(record.id)}>
                <TableCell>
                  <div className="font-medium text-foreground">{directionLabels[record.direction] || record.direction}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{record.id}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{record.scene}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {record.successCount || 0}/{record.totalCount || 0}
                  {record.failCount ? <span className="ml-1 text-destructive">失败 {record.failCount}</span> : null}
                </TableCell>
                <TableCell className="max-w-80 truncate text-muted-foreground" title={record.message || ''}>
                  {record.message || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">{record.createTime || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="源文件"
                      aria-label="源文件"
                      disabled={!record.sourceObjectId}
                      onClick={() => downloadObject(record.sourceObjectId, `import-${record.id}`)}
                    >
                      <FileUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="结果文件"
                      aria-label="结果文件"
                      disabled={!record.resultObjectId}
                      onClick={() => downloadObject(record.resultObjectId, `export-${record.id}`)}
                    >
                      <Download />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="错误明细"
                      aria-label="错误明细"
                      disabled={!record.errorObjectId}
                      onClick={() => downloadObject(record.errorObjectId, `errors-${record.id}`)}
                    >
                      <FileWarning />
                    </Button>
                  </div>
                </TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="删除任务"
                      aria-label="删除任务"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteTask(record)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && page.records.length === 0 ? <EmptyState text="暂无导入导出任务" /> : null}
        {loading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
        <Pagination
          pageNo={page.pageNo}
          pageSize={page.pageSize}
          total={page.total}
          onChange={(pageNo) => setQuery((current) => ({ ...current, pageNo }))}
        />
      </Card>
    </div>
  )
}
