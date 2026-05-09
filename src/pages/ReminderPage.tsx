import { Bell, CheckCircle2, Pencil, Plus, RefreshCw, Save, Search, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  cancelReminderApi,
  completeReminderApi,
  createReminderApi,
  deleteRemindersApi,
  getReminderDetailApi,
  queryReminderPage,
  updateReminderApi,
  type ReminderQuery,
  type ReminderRecord,
  type ReminderSaveRequest,
  type ReminderStatus
} from '@/api/reminder'
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
import type { IdValue, PageResult } from '@/types/common'

const ALL_STATUS_VALUE = '__all_status__'

const defaultQuery: ReminderQuery = {
  pageNo: 1,
  pageSize: 10,
  title: '',
  status: '',
  dueOnly: false
}

const emptyForm: ReminderSaveRequest = {
  title: '',
  content: '',
  remindTime: '',
  remark: ''
}

const statusLabels: Record<ReminderStatus, string> = {
  PENDING: '待提醒',
  DONE: '已完成',
  CANCELLED: '已取消'
}

function StatusBadge({ reminder }: { reminder: ReminderRecord }) {
  if (reminder.status === 'PENDING' && reminder.due) {
    return <Badge variant="destructive">已到期</Badge>
  }
  const variant = reminder.status === 'DONE' ? 'success' : reminder.status === 'CANCELLED' ? 'muted' : 'secondary'
  return <Badge variant={variant}>{statusLabels[reminder.status] || reminder.status}</Badge>
}

function toApiDateTime(input: string): string {
  if (!input) {
    return ''
  }
  return `${input.replace('T', ' ')}:00`
}

function toDateTimeInput(input?: string): string {
  if (!input) {
    return ''
  }
  return input.replace(' ', 'T').slice(0, 16)
}

function defaultReminderTime(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setSeconds(0, 0)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export default function ReminderPage() {
  const [query, setQuery] = useState<ReminderQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<ReminderRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [editingId, setEditingId] = useState<IdValue | null>(null)
  const [form, setForm] = useState<ReminderSaveRequest>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchReminders()
  }, [query.pageNo, query.pageSize, query.status, query.dueOnly])

  async function fetchReminders(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryReminderPage({
        ...nextQuery,
        title: nextQuery.title || undefined,
        status: nextQuery.status || undefined,
        dueOnly: nextQuery.dueOnly || undefined
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提醒失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, remindTime: defaultReminderTime() })
    setModalOpen(true)
  }

  async function openEdit(reminder: ReminderRecord) {
    setError('')
    try {
      const detail = await getReminderDetailApi(reminder.id)
      setEditingId(detail.id)
      setForm({
        title: detail.title,
        content: detail.content || '',
        remindTime: toDateTimeInput(detail.remindTime),
        remark: detail.remark || ''
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提醒详情失败')
    }
  }

  function updateForm(field: keyof ReminderSaveRequest, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveReminder() {
    setSaving(true)
    setError('')
    try {
      const data = { ...form, remindTime: toApiDateTime(form.remindTime) }
      if (editingId) {
        await updateReminderApi(editingId, data)
      } else {
        await createReminderApi(data)
      }
      setModalOpen(false)
      await fetchReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存提醒失败')
    } finally {
      setSaving(false)
    }
  }

  async function completeReminder(reminder: ReminderRecord) {
    setError('')
    try {
      await completeReminderApi(reminder.id)
      await fetchReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : '完成提醒失败')
    }
  }

  async function cancelReminder(reminder: ReminderRecord) {
    if (!window.confirm(`确认取消提醒 ${reminder.title}？`)) {
      return
    }
    setError('')
    try {
      await cancelReminderApi(reminder.id)
      await fetchReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消提醒失败')
    }
  }

  async function deleteReminder(reminder: ReminderRecord) {
    if (!window.confirm(`确认删除提醒 ${reminder.title}？`)) {
      return
    }
    setError('')
    try {
      await deleteRemindersApi([reminder.id])
      await fetchReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除提醒失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchReminders(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchReminders(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="提醒中心"
        description="维护个人待办提醒和到期事项。"
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus />
            新建提醒
          </Button>
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_160px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="reminder-search-title">标题</Label>
              <Input
                id="reminder-search-title"
                placeholder="请输入提醒标题"
                value={query.title}
                onChange={(event) => setQuery((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={query.status || ALL_STATUS_VALUE}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    status: value === ALL_STATUS_VALUE ? '' : (value as ReminderStatus),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>全部状态</SelectItem>
                  <SelectItem value="PENDING">待提醒</SelectItem>
                  <SelectItem value="DONE">已完成</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>范围</Label>
              <Select
                value={query.dueOnly ? 'due' : 'all'}
                onValueChange={(value) => setQuery((current) => ({ ...current, dueOnly: value === 'due', pageNo: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部提醒</SelectItem>
                  <SelectItem value="due">只看已到期</SelectItem>
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
              <TableHead className="min-w-52">提醒</TableHead>
              <TableHead className="min-w-40">提醒时间</TableHead>
              <TableHead className="w-28">状态</TableHead>
              <TableHead className="min-w-40">处理时间</TableHead>
              <TableHead className="min-w-48">备注</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((reminder) => (
              <TableRow key={String(reminder.id)}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {reminder.due && reminder.status === 'PENDING' ? <Bell className="size-4 text-destructive" /> : null}
                    <span>{reminder.title}</span>
                  </div>
                  {reminder.content ? <div className="mt-1 max-w-96 truncate text-sm text-muted-foreground">{reminder.content}</div> : null}
                </TableCell>
                <TableCell className="text-muted-foreground">{reminder.remindTime}</TableCell>
                <TableCell>
                  <StatusBadge reminder={reminder} />
                </TableCell>
                <TableCell className="text-muted-foreground">{reminder.doneTime || reminder.cancelTime || '-'}</TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground" title={reminder.remark || ''}>
                  {reminder.remark || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="编辑提醒"
                      aria-label="编辑提醒"
                      disabled={reminder.status !== 'PENDING'}
                      onClick={() => void openEdit(reminder)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="完成提醒"
                      aria-label="完成提醒"
                      disabled={reminder.status !== 'PENDING'}
                      onClick={() => void completeReminder(reminder)}
                    >
                      <CheckCircle2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="取消提醒"
                      aria-label="取消提醒"
                      disabled={reminder.status !== 'PENDING'}
                      onClick={() => void cancelReminder(reminder)}
                    >
                      <XCircle />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="删除提醒"
                      aria-label="删除提醒"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => void deleteReminder(reminder)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && page.records.length === 0 ? <EmptyState text="暂无提醒" /> : null}
        {loading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
        <Pagination
          pageNo={page.pageNo}
          pageSize={page.pageSize}
          total={page.total}
          onChange={(pageNo) => setQuery((current) => ({ ...current, pageNo }))}
        />
      </Card>

      <Modal
        title={editingId ? '编辑提醒' : '新建提醒'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveReminder()}>
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">标题</Label>
            <Input id="reminder-title" value={form.title} maxLength={128} onChange={(event) => updateForm('title', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-time">提醒时间</Label>
            <Input
              id="reminder-time"
              type="datetime-local"
              value={form.remindTime}
              onChange={(event) => updateForm('remindTime', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-content">内容</Label>
            <textarea
              id="reminder-content"
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.content}
              maxLength={1000}
              onChange={(event) => updateForm('content', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-remark">备注</Label>
            <Input id="reminder-remark" value={form.remark} maxLength={255} onChange={(event) => updateForm('remark', event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
