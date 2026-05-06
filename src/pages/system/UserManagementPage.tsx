import { Pencil, RefreshCw, Save, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { queryRoleOptionsApi, type RoleOption } from '@/api/role'
import {
  queryUserPage,
  updateManagedUserApi,
  type ManagedUser,
  type ManagedUserUpdateRequest,
  type UserManagementQuery
} from '@/api/user'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
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

export default function UserManagementPage() {
  const [query, setQuery] = useState<UserManagementQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<ManagedUser>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [editForm, setEditForm] = useState<UserEditForm>({ nickname: '', email: '', phone: '', status: 1, roleKeys: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
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
    <div className="page-stack">
      <PageHeader title="用户管理" description="维护系统用户的基础资料、状态和角色归属。" />
      <form className="toolbar" onSubmit={submitSearch}>
        <input
          placeholder="用户名"
          value={query.username}
          onChange={(event) => setQuery((current) => ({ ...current, username: event.target.value }))}
        />
        <input
          placeholder="昵称"
          value={query.nickname}
          onChange={(event) => setQuery((current) => ({ ...current, nickname: event.target.value }))}
        />
        <select
          value={query.roleKey}
          onChange={(event) => setQuery((current) => ({ ...current, roleKey: event.target.value, pageNo: 1 }))}
        >
          <option value="">全部角色</option>
          {roleOptions.map((role) => (
            <option key={role.roleKey} value={role.roleKey}>
              {role.roleName}
            </option>
          ))}
        </select>
        <select
          value={query.status}
          onChange={(event) =>
            setQuery((current) => ({
              ...current,
              status: event.target.value === '' ? '' : Number(event.target.value),
              pageNo: 1
            }))
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
        <button className="btn ghost" type="button" onClick={resetSearch}>
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
                <th>用户名</th>
                <th>昵称</th>
                <th>联系方式</th>
                <th>角色</th>
                <th>状态</th>
                <th>最后登录</th>
                <th className="actions-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {page.records.map((user) => (
                <tr key={String(user.id)}>
                  <td>
                    <strong>{user.username}</strong>
                    {user.immutable ? <span className="mini-tag">内置</span> : null}
                  </td>
                  <td>{user.nickname || '-'}</td>
                  <td>
                    <div>{user.email || '-'}</div>
                    <small>{user.phone || ''}</small>
                  </td>
                  <td>{user.roles.length ? user.roles.join(', ') : '-'}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>{user.lastLoginTime || '-'}</td>
                  <td>
                    <button className="icon-btn" type="button" title="编辑用户" onClick={() => openEdit(user)}>
                      <Pencil size={17} />
                    </button>
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
        title={selectedUser ? `编辑用户：${selectedUser.username}` : '编辑用户'}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setSelectedUser(null)}>
              取消
            </button>
            <button className="btn primary" type="button" disabled={saving} onClick={saveUser}>
              <Save size={18} />
              保存
            </button>
          </>
        }
      >
        <div className="form-grid two">
          <label className="field">
            <span>昵称</span>
            <input value={editForm.nickname} onChange={(event) => updateEditField('nickname', event.target.value)} />
          </label>
          <label className="field">
            <span>邮箱</span>
            <input value={editForm.email} onChange={(event) => updateEditField('email', event.target.value)} />
          </label>
          <label className="field">
            <span>手机</span>
            <input value={editForm.phone} onChange={(event) => updateEditField('phone', event.target.value)} />
          </label>
          <label className="field">
            <span>状态</span>
            <select value={editForm.status} onChange={(event) => updateEditField('status', Number(event.target.value))}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </label>
          <div className="field two-span">
            <span>角色</span>
            <div className="check-grid">
              {roleOptions.map((role) => (
                <label key={role.roleKey} className="check-item">
                  <input
                    type="checkbox"
                    checked={editForm.roleKeys.includes(role.roleKey)}
                    onChange={() => toggleRole(role.roleKey)}
                  />
                  <span>{role.roleName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
