import { RefreshCw, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { queryAuditLogPage, type AuditLogQuery, type AuditLogRecord } from '@/api/system'
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
import type { PageResult } from '@/types/common'

const ALL_RESULT_VALUE = '__all_result__'

const defaultQuery: AuditLogQuery = {
  pageNo: 1,
  pageSize: 10,
  username: '',
  eventType: '',
  eventName: '',
  result: '',
  startTime: '',
  endTime: ''
}

function normalizeTime(value?: string): string | undefined {
  if (!value) {
    return undefined
  }
  return `${value.replace('T', ' ')}:00`
}

function resultBadge(result?: number) {
  if (result === undefined || result === null) {
    return <span className="text-muted-foreground">-</span>
  }
  const success = Number(result) === 1
  return <Badge variant={success ? 'success' : 'destructive'}>{success ? '成功' : '失败'}</Badge>
}

export default function AuditLogPage() {
  const [query, setQuery] = useState<AuditLogQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<AuditLogRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchAuditLogs()
  }, [query.pageNo, query.pageSize, query.result])

  async function fetchAuditLogs(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryAuditLogPage({
        ...nextQuery,
        username: nextQuery.username || undefined,
        eventType: nextQuery.eventType || undefined,
        eventName: nextQuery.eventName || undefined,
        result: nextQuery.result === '' ? undefined : nextQuery.result,
        startTime: normalizeTime(nextQuery.startTime),
        endTime: normalizeTime(nextQuery.endTime)
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchAuditLogs(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchAuditLogs(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="审计日志" description="查询用户登录、权限与系统操作审计记录。" />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px_minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="audit-search-username">用户名</Label>
              <Input
                id="audit-search-username"
                placeholder="请输入用户名"
                value={query.username}
                onChange={(event) => setQuery((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-search-event-type">事件类型</Label>
              <Input
                id="audit-search-event-type"
                placeholder="login"
                value={query.eventType}
                onChange={(event) => setQuery((current) => ({ ...current, eventType: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-search-event-name">事件名称</Label>
              <Input
                id="audit-search-event-name"
                placeholder="请输入事件名称"
                value={query.eventName}
                onChange={(event) => setQuery((current) => ({ ...current, eventName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>结果</Label>
              <Select
                value={query.result === '' ? ALL_RESULT_VALUE : String(query.result)}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    result: value === ALL_RESULT_VALUE ? '' : Number(value),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_RESULT_VALUE}>全部结果</SelectItem>
                  <SelectItem value="1">成功</SelectItem>
                  <SelectItem value="0">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-search-start">开始时间</Label>
              <Input
                id="audit-search-start"
                type="datetime-local"
                value={query.startTime}
                onChange={(event) => setQuery((current) => ({ ...current, startTime: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-search-end">结束时间</Label>
              <Input
                id="audit-search-end"
                type="datetime-local"
                value={query.endTime}
                onChange={(event) => setQuery((current) => ({ ...current, endTime: event.target.value }))}
              />
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
              <TableHead className="min-w-36">时间</TableHead>
              <TableHead className="min-w-32">用户</TableHead>
              <TableHead className="min-w-32">事件类型</TableHead>
              <TableHead className="min-w-40">事件名称</TableHead>
              <TableHead className="min-w-48">请求路径</TableHead>
              <TableHead className="min-w-32">客户端 IP</TableHead>
              <TableHead className="w-24">结果</TableHead>
              <TableHead className="min-w-52">消息</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((log) => (
              <TableRow key={String(log.id)}>
                <TableCell className="text-muted-foreground">{log.occurTime || '-'}</TableCell>
                <TableCell>
                  <span className="font-medium text-foreground">{log.username || '-'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-muted-foreground">
                    {log.eventType || '-'}
                  </Badge>
                </TableCell>
                <TableCell>{log.eventName || '-'}</TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground">{log.requestUri || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{log.clientIp || '-'}</TableCell>
                <TableCell>{resultBadge(log.result)}</TableCell>
                <TableCell className="max-w-80 truncate text-muted-foreground">{log.message || '-'}</TableCell>
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
    </div>
  )
}
