import { FileDown, FileUp, Pencil, RefreshCw, Save, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { queryRoleOptionsApi, type RoleOption } from '@/api/role'
import {
  queryUserPage,
  updateManagedUserApi,
  type ManagedUser,
  type ManagedUserUpdateRequest,
  type UserManagementQuery
} from '@/api/user'
import DataExchangeDialog from '@/components/DataExchangeDialog'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
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
import type { PageResult } from '@/types/common'

interface UserEditForm extends ManagedUserUpdateRequest {}

const defaultQuery: UserManagementQuery = {
  pageNo: 1,
  pageSize: 10,
  username: '',
  nickname: '',
  roleKey: '',
  status: ''
}

const ALL_ROLES_VALUE = '__all_roles__'
const ALL_STATUS_VALUE = '__all_status__'

export default function UserManagementPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission('system:user:manage')
  const [query, setQuery] = useState<UserManagementQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<ManagedUser>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [editForm, setEditForm] = useState<UserEditForm>({ nickname: '', email: '', phone: '', status: 1, roleKeys: [] })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    queryRoleOptionsApi().then(setRoleOptions).catch(() => setRoleOptions([]))
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [query.pageNo, query.pageSize, query.roleKey, query.status])

  async function fetchUsers(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const normalizedQuery = {
        ...nextQuery,
        username: nextQuery.username || undefined,
        nickname: nextQuery.nickname || undefined,
        roleKey: nextQuery.roleKey || undefined,
        status: nextQuery.status === '' ? undefined : nextQuery.status
      }
      const result = await queryUserPage(normalizedQuery)
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户失败')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(user: ManagedUser) {
    setSelectedUser(user)
    setEditForm({
      nickname: user.nickname || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
      roleKeys: user.roles || []
    })
  }

  function updateEditField(field: keyof Omit<UserEditForm, 'roleKeys'>, value: string | number) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  function toggleRole(roleKey: string) {
    setEditForm((current) => {
      const nextRoles = current.roleKeys.includes(roleKey)
        ? current.roleKeys.filter((item) => item !== roleKey)
        : [...current.roleKeys, roleKey]
      return { ...current, roleKeys: nextRoles }
    })
  }

  async function saveUser() {
    if (!selectedUser) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateManagedUserApi(selectedUser.id, editForm)
      setSelectedUser(null)
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存用户失败')
    } finally {
      setSaving(false)
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchUsers(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchUsers(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="用户管理"
        description="维护系统用户的基础资料、状态和角色归属。"
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Button variant="outline" type="button" onClick={() => setImportDialogOpen(true)}>
                <FileUp />
                导入
              </Button>
            ) : null}
            <Button type="button" onClick={() => setExportDialogOpen(true)}>
              <FileDown />
              导出
            </Button>
          </div>
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_180px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="user-search-username">用户名</Label>
              <Input
                id="user-search-username"
                placeholder="请输入用户名"
                value={query.username}
                onChange={(event) => setQuery((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-search-nickname">昵称</Label>
              <Input
                id="user-search-nickname"
                placeholder="请输入昵称"
                value={query.nickname}
                onChange={(event) => setQuery((current) => ({ ...current, nickname: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={query.roleKey || ALL_ROLES_VALUE}
                onValueChange={(value) =>
                  setQuery((current) => ({ ...current, roleKey: value === ALL_ROLES_VALUE ? '' : value, pageNo: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROLES_VALUE}>全部角色</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.roleKey} value={role.roleKey}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/90">
            <TableRow className="hover:bg-slate-50/90">
              <TableHead className="min-w-40">用户名</TableHead>
              <TableHead>昵称</TableHead>
              <TableHead className="min-w-48">联系方式</TableHead>
              <TableHead className="min-w-48">角色</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-40">最后登录</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((user) => (
              <TableRow key={String(user.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{user.username}</span>
                    {user.immutable ? <Badge variant="secondary">内置</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.nickname || '-'}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-foreground">{user.email || '-'}</div>
                    {user.phone ? <div className="text-xs text-muted-foreground">{user.phone}</div> : null}
                  </div>
                </TableCell>
                <TableCell>
                  {user.roles.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="outline" className="border-blue-100 bg-blue-50/60 text-blue-700">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{user.lastLoginTime || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" type="button" title="编辑用户" aria-label="编辑用户" onClick={() => openEdit(user)}>
                    <Pencil />
                  </Button>
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
      </Card>

      <DataExchangeDialog
        scene="system-user-import"
        title="导入用户"
        mode="import"
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={(task) => {
          setNotice(`用户导入完成：成功 ${task.successCount || 0} 条，失败 ${task.failCount || 0} 条`)
          void fetchUsers()
        }}
        hint="先下载模板，按 username、nickname、email、phone、password、roleKeys、status 填写。多个角色用 | 分隔。"
      />

      <DataExchangeDialog
        scene="system-user-export"
        title="导出用户"
        mode="export"
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        queryParams={{
          username: query.username || undefined,
          nickname: query.nickname || undefined,
          roleKey: query.roleKey || undefined,
          status: query.status === '' ? undefined : query.status
        }}
        onSuccess={() => setNotice('用户导出已生成，文件已开始下载')}
      />

      <Modal
        title={selectedUser ? `编辑用户：${selectedUser.username}` : '编辑用户'}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setSelectedUser(null)}>
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={saveUser}>
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user-edit-nickname">昵称</Label>
            <Input id="user-edit-nickname" value={editForm.nickname} onChange={(event) => updateEditField('nickname', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-edit-email">邮箱</Label>
            <Input id="user-edit-email" value={editForm.email} onChange={(event) => updateEditField('email', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-edit-phone">手机</Label>
            <Input id="user-edit-phone" value={editForm.phone} onChange={(event) => updateEditField('phone', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={String(editForm.status)} onValueChange={(value) => updateEditField('status', Number(value))}>
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
            <Label>角色</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleOptions.length ? (
                roleOptions.map((role) => (
                  <label
                    key={role.roleKey}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-100 bg-slate-50/70 px-3 py-2 text-sm transition-colors hover:bg-blue-50/70"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-blue-200 accent-blue-600"
                      checked={editForm.roleKeys.includes(role.roleKey)}
                      onChange={() => toggleRole(role.roleKey)}
                    />
                    <span>{role.roleName}</span>
                  </label>
                ))
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground sm:col-span-2">
                  暂无可选角色
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
