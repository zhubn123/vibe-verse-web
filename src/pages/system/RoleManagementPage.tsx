import { Plus, RefreshCw, Save, Search, Trash2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import type { IdValue, PageResult } from '@/types/common'

const emptyRoleForm: RoleSaveRequest = {
  roleKey: '',
  roleName: '',
  status: 1,
  remark: '',
  permissionKeys: []
}

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

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchRoles(nextQuery)
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="角色权限"
        description="管理角色、权限码和后台系统访问范围。"
        actions={
          <button className="btn primary" type="button" onClick={openCreate}>
            <Plus size={18} />
            新建角色
          </button>
        }
      />
      <form className="toolbar" onSubmit={submitSearch}>
        <input
          placeholder="角色编码"
          value={query.roleKey}
          onChange={(event) => setQuery((current) => ({ ...current, roleKey: event.target.value }))}
        />
        <input
          placeholder="角色名称"
          value={query.roleName}
          onChange={(event) => setQuery((current) => ({ ...current, roleName: event.target.value }))}
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
            const nextQuery = { pageNo: 1, pageSize: 10, roleKey: '', roleName: '', status: '' as number | '' }
            setQuery(nextQuery)
            void fetchRoles(nextQuery)
          }}
        >
          <RefreshCw size={18} />
          重置
        </button>
      </form>
      {error ? <div className="notice error">{error}</div> : null}
      <section className="table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>角色编码</th>
                <th>角色名称</th>
                <th>用户数</th>
                <th>权限数</th>
                <th>状态</th>
                <th>备注</th>
                <th className="actions-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {page.records.map((role) => (
                <tr key={String(role.id)}>
                  <td>
                    <strong>{role.roleKey}</strong>
                    {role.builtIn ? <span className="mini-tag">内置</span> : null}
                  </td>
                  <td>{role.roleName}</td>
                  <td>{role.userCount}</td>
                  <td>{role.permissionCount}</td>
                  <td>
                    <StatusBadge status={role.status} />
                  </td>
                  <td>{role.remark || '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" type="button" title="编辑角色" disabled={!role.modifiable} onClick={() => openEdit(role)}>
                        <Pencil size={17} />
                      </button>
                      <button className="icon-btn danger" type="button" title="删除角色" disabled={!role.deletable} onClick={() => deleteRole(role)}>
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
      <Modal
        title={editingId ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setModalOpen(false)}>
              取消
            </button>
            <button className="btn primary" type="button" disabled={saving || !form.roleKey || !form.roleName} onClick={saveRole}>
              <Save size={18} />
              保存
            </button>
          </>
        }
      >
        <div className="form-grid two">
          <label className="field">
            <span>角色编码</span>
            <input value={form.roleKey} disabled={!!editingId} onChange={(event) => updateForm('roleKey', event.target.value)} />
          </label>
          <label className="field">
            <span>角色名称</span>
            <input value={form.roleName} onChange={(event) => updateForm('roleName', event.target.value)} />
          </label>
          <label className="field">
            <span>状态</span>
            <select value={form.status} onChange={(event) => updateForm('status', Number(event.target.value))}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </label>
          <label className="field">
            <span>备注</span>
            <input value={form.remark || ''} onChange={(event) => updateForm('remark', event.target.value)} />
          </label>
          <div className="field two-span">
            <span>权限</span>
            <div className="permission-list">
              {permissionGroups.map((group) => (
                <section key={group.module} className="permission-group">
                  <strong>{group.moduleName}</strong>
                  <div className="check-grid">
                    {group.permissions.map((permission) => (
                      <label key={permission.permKey} className="check-item">
                        <input
                          type="checkbox"
                          checked={form.permissionKeys.includes(permission.permKey)}
                          onChange={() => togglePermission(permission.permKey)}
                        />
                        <span>{permission.permName}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
