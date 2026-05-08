import { Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  createMenuApi,
  deleteMenusApi,
  getMenuDetailApi,
  listMenuTreeApi,
  updateMenuApi,
  type MenuManageRecord,
  type MenuSaveRequest
} from '@/api/system'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
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
import { resolveMenuIcon } from '@/utils/menu'
import type { IdValue } from '@/types/common'

const ROOT_PARENT_VALUE = '__root__'

const emptyForm: MenuSaveRequest = {
  parentId: 0,
  menuKey: '',
  title: '',
  path: '',
  icon: '',
  permissionKey: '',
  sortOrder: 10,
  visible: 1,
  status: 1,
  remark: ''
}

function flattenMenuTree(items: MenuManageRecord[], depth = 0): Array<MenuManageRecord & { depth: number }> {
  return items.flatMap((item) => [
    { ...item, depth },
    ...flattenMenuTree(item.children || [], depth + 1)
  ])
}

function VisibleBadge({ visible }: { visible: number }) {
  return <Badge variant={Number(visible) === 1 ? 'success' : 'muted'}>{Number(visible) === 1 ? '显示' : '隐藏'}</Badge>
}

export default function MenuManagementPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission('system:menu:manage')
  const [menus, setMenus] = useState<MenuManageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<IdValue | null>(null)
  const [form, setForm] = useState<MenuSaveRequest>(emptyForm)

  const flatMenus = useMemo(() => flattenMenuTree(menus), [menus])
  const parentOptions = useMemo(
    () => flatMenus.filter((item) => item.id !== editingId),
    [editingId, flatMenus]
  )

  useEffect(() => {
    void fetchMenus()
  }, [])

  async function fetchMenus() {
    setLoading(true)
    setError('')
    try {
      setMenus(await listMenuTreeApi())
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载菜单失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreate(parentId = 0) {
    setEditingId(null)
    setForm({ ...emptyForm, parentId, sortOrder: 10 })
    setModalOpen(true)
  }

  async function openEdit(menu: MenuManageRecord) {
    setError('')
    try {
      const detail = await getMenuDetailApi(menu.id)
      setEditingId(detail.id)
      setForm({
        parentId: Number(detail.parentId || 0),
        menuKey: detail.menuKey,
        title: detail.title,
        path: detail.path || '',
        icon: detail.icon || '',
        permissionKey: detail.permissionKey || '',
        sortOrder: detail.sortOrder,
        visible: detail.visible,
        status: detail.status,
        remark: detail.remark || ''
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载菜单详情失败')
    }
  }

  function updateForm(field: keyof MenuSaveRequest, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveMenu() {
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateMenuApi(editingId, form)
      } else {
        await createMenuApi(form)
      }
      setModalOpen(false)
      await fetchMenus()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存菜单失败')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMenu(menu: MenuManageRecord) {
    if (!window.confirm(`确认删除菜单 ${menu.title}？`)) {
      return
    }
    setError('')
    try {
      await deleteMenusApi([menu.id])
      await fetchMenus()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除菜单失败')
    }
  }

  function renderRows(items: MenuManageRecord[], depth = 0): ReactElement[] {
    return items.flatMap((menu) => {
      const Icon = resolveMenuIcon(menu.icon)
      const row = (
        <TableRow key={String(menu.id)}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium text-foreground">{menu.title}</span>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground">{menu.menuKey}</TableCell>
          <TableCell className="text-muted-foreground">{menu.path || '-'}</TableCell>
          <TableCell className="text-muted-foreground">{menu.permissionKey || '-'}</TableCell>
          <TableCell className="text-muted-foreground">{menu.sortOrder}</TableCell>
          <TableCell>
            <VisibleBadge visible={menu.visible} />
          </TableCell>
          <TableCell>
            <StatusBadge status={menu.status} />
          </TableCell>
          <TableCell className="text-right">
            {canManage ? (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" type="button" title="新增子菜单" aria-label="新增子菜单" onClick={() => openCreate(Number(menu.id))}>
                  <Plus />
                </Button>
                <Button variant="ghost" size="icon" type="button" title="编辑菜单" aria-label="编辑菜单" onClick={() => openEdit(menu)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  title="删除菜单"
                  aria-label="删除菜单"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteMenu(menu)}
                >
                  <Trash2 />
                </Button>
              </div>
            ) : null}
          </TableCell>
        </TableRow>
      )
      return [row, ...(menu.children?.length ? renderRows(menu.children, depth + 1) : [])]
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="菜单管理"
        description="维护后台导航菜单、权限码和层级结构。"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => void fetchMenus()}>
              <RefreshCw />
              刷新
            </Button>
            {canManage ? (
              <Button type="button" onClick={() => openCreate()}>
                <Plus />
                新建菜单
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/90">
              <TableRow className="hover:bg-slate-50/90">
                <TableHead className="min-w-40">菜单</TableHead>
                <TableHead className="min-w-32">标识</TableHead>
                <TableHead className="min-w-40">路径</TableHead>
                <TableHead className="min-w-40">权限码</TableHead>
                <TableHead className="w-20">排序</TableHead>
                <TableHead className="w-20">显示</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderRows(menus)}</TableBody>
          </Table>
          {!loading && menus.length === 0 ? <EmptyState text="暂无菜单" /> : null}
          {loading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
        </CardContent>
      </Card>

      <Modal
        title={editingId ? '编辑菜单' : '新建菜单'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={saving || !form.menuKey || !form.title}
              onClick={saveMenu}
            >
              <Save />
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>父菜单</Label>
            <Select
              value={String(form.parentId)}
              onValueChange={(value) => updateForm('parentId', value === ROOT_PARENT_VALUE ? 0 : Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_PARENT_VALUE}>根菜单</SelectItem>
                {parentOptions.map((menu) => (
                  <SelectItem key={String(menu.id)} value={String(menu.id)}>
                    {`${menu.depth > 0 ? '—'.repeat(menu.depth) + ' ' : ''}${menu.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-key">菜单标识</Label>
            <Input
              id="menu-key"
              value={form.menuKey}
              disabled={!!editingId}
              onChange={(event) => updateForm('menuKey', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-title">菜单标题</Label>
            <Input id="menu-title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-path">路由路径</Label>
            <Input id="menu-path" value={form.path || ''} onChange={(event) => updateForm('path', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-icon">图标</Label>
            <Input id="menu-icon" value={form.icon || ''} onChange={(event) => updateForm('icon', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-permission">权限码</Label>
            <Input id="menu-permission" value={form.permissionKey || ''} onChange={(event) => updateForm('permissionKey', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-sort">排序号</Label>
            <Input id="menu-sort" type="number" value={form.sortOrder} onChange={(event) => updateForm('sortOrder', Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>显示</Label>
            <Select value={String(form.visible)} onValueChange={(value) => updateForm('visible', Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">显示</SelectItem>
                <SelectItem value="0">隐藏</SelectItem>
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
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="menu-remark">备注</Label>
            <Input id="menu-remark" value={form.remark || ''} onChange={(event) => updateForm('remark', event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
