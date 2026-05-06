import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createRoleApi,
  deleteRolesApi,
  getRoleDetailApi,
  listPermissionCatalogApi,
  queryRolePage,
  updateRoleApi,
  type PermissionGroup,
  type RoleRecord,
  type RoleSaveRequest
} from '@/api/role'
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
import type { IdValue, PageResult } from '@/types/common'

const emptyRoleForm: RoleSaveRequest = {
  roleKey: '',
  roleName: '',
  status: 1,
  remark: '',
  permissionKeys: []
}

const ALL_STATUS_VALUE = '__all_status__'

export default function RoleManagementPage() {
  const [query, setQuery] = useState({ pageNo: 1, pageSize: 10, roleKey: '', roleName: '', status: '' as number | '' })
  const [page, setPage] = useState<PageResult<RoleRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [editingId, setEditingId] = useState<IdValue | null>(null)
  const [form, setForm] = useState<RoleSaveRequest>(emptyRoleForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listPermissionCatalogApi().then(setPermissionGroups).catch(() => setPermissionGroups([]))
  }, [])

  useEffect(() => {
    void fetchRoles()
  }, [query.pageNo, query.pageSize, query.status])

  async function fetchRoles(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryRolePage({
        ...nextQuery,
        roleKey: nextQuery.roleKey || undefined,
        roleName: nextQuery.roleName || undefined,
        status: nextQuery.status === '' ? undefined : nextQuery.status
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载角色失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyRoleForm)
    setModalOpen(true)
  }

  async function openEdit(role: RoleRecord) {
    setError('')
    try {
      const detail = await getRoleDetailApi(role.id)
      setEditingId(detail.id)
      setForm({
        roleKey: detail.roleKey,
        roleName: detail.roleName,
        status: detail.status,
        remark: detail.remark || '',
        permissionKeys: detail.permissionKeys || []
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载角色详情失败')
    }
  }

  function updateForm(field: keyof RoleSaveRequest, value: string | number | string[]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function togglePermission(permKey: string) {
    setForm((current) => {
      const nextKeys = current.permissionKeys.includes(permKey)
        ? current.permissionKeys.filter((item) => item !== permKey)
        : [...current.permissionKeys, permKey]
      return { ...current, permissionKeys: nextKeys }
    })
  }

  async function saveRole() {
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateRoleApi(editingId, form)
      } else {
        await createRoleApi(form)
      }
      setModalOpen(false)
      await fetchRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存角色失败')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRole(role: RoleRecord) {
    if (!role.deletable || !window.confirm(`确认删除角色 ${role.roleName}？`)) {
      return
    }
    setError('')
    try {
      await deleteRolesApi([role.id])
      await fetchRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除角色失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchRoles(nextQuery)
  }

  function resetSearch() {
    const nextQuery = { pageNo: 1, pageSize: 10, roleKey: '', roleName: '', status: '' as number | '' }
    setQuery(nextQuery)
    void fetchRoles(nextQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="角色权限"
        description="管理角色、权限码和后台系统访问范围。"
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus />
            新建角色
          </Button>
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label htmlFor="role-search-key">角色编码</Label>
              <Input
                id="role-search-key"
                placeholder="请输入角色编码"
                value={query.roleKey}
                onChange={(event) => setQuery((current) => ({ ...current, roleKey: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-search-name">角色名称</Label>
              <Input
                id="role-search-name"
                placeholder="请输入角色名称"
                value={query.roleName}
                onChange={(event) => setQuery((current) => ({ ...current, roleName: event.target.value }))}
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

      <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/90">
            <TableRow className="hover:bg-slate-50/90">
              <TableHead className="min-w-44">角色编码</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead className="w-24">用户数</TableHead>
              <TableHead className="w-24">权限数</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-52">备注</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((role) => (
              <TableRow key={String(role.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{role.roleKey}</span>
                    {role.builtIn ? <Badge variant="secondary">内置</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>{role.roleName}</TableCell>
                <TableCell className="text-muted-foreground">{role.userCount}</TableCell>
                <TableCell className="text-muted-foreground">{role.permissionCount}</TableCell>
                <TableCell>
                  <StatusBadge status={role.status} />
                </TableCell>
                <TableCell className="max-w-80 truncate text-muted-foreground">{role.remark || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="编辑角色"
                      aria-label="编辑角色"
                      disabled={!role.modifiable}
                      onClick={() => openEdit(role)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title="删除角色"
                      aria-label="删除角色"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={!role.deletable}
                      onClick={() => deleteRole(role)}
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
      </Card>

      <Modal
        title={editingId ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={saving || !form.roleKey || !form.roleName} onClick={saveRole}>
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-form-key">角色编码</Label>
            <Input
              id="role-form-key"
              value={form.roleKey}
              disabled={!!editingId}
              onChange={(event) => updateForm('roleKey', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-form-name">角色名称</Label>
            <Input id="role-form-name" value={form.roleName} onChange={(event) => updateForm('roleName', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={String(form.status)} onValueChange={(value) => updateForm('status', Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-form-remark">备注</Label>
            <Input id="role-form-remark" value={form.remark || ''} onChange={(event) => updateForm('remark', event.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>权限</Label>
            <div className="space-y-3">
              {permissionGroups.length ? (
                permissionGroups.map((group) => (
                  <section key={group.module} className="rounded-lg border border-blue-100 bg-slate-50/70 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-medium text-foreground">{group.moduleName}</div>
                      <Badge variant="outline" className="bg-background text-muted-foreground">
                        {group.permissions.length} 项
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission.permKey}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-blue-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-blue-200 accent-blue-600"
                            checked={form.permissionKeys.includes(permission.permKey)}
                            onChange={() => togglePermission(permission.permKey)}
                          />
                          <span>{permission.permName}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                  暂无权限目录
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
