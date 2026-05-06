import { BookOpen, ShieldCheck, User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const auth = useAuth()
  const isAdmin = auth.hasRole('admin')

  return (
    <div className="page-stack">
      <PageHeader title="工作台" description="系统底座已经就绪，后续业务模块可以从这里接入。" />
      <section className="metric-grid">
        <div className="metric-panel">
          <User size={22} />
          <span>当前用户</span>
          <strong>{auth.userInfo?.nickname || auth.userInfo?.username || '-'}</strong>
        </div>
        <div className="metric-panel accent">
          <ShieldCheck size={22} />
          <span>角色</span>
          <strong>{auth.roles.length ? auth.roles.join(', ') : '-'}</strong>
        </div>
        <div className="metric-panel warm">
          <Users size={22} />
          <span>系统管理</span>
          <strong>{isAdmin ? '可访问' : '未授权'}</strong>
        </div>
      </section>
      <section className="quick-grid">
        <Link to="/profile" className="quick-action">
          <User size={20} />
          <span>个人资料</span>
        </Link>
        {isAdmin ? (
          <>
            <Link to="/system/users" className="quick-action">
              <Users size={20} />
              <span>用户管理</span>
            </Link>
            <Link to="/system/roles" className="quick-action">
              <ShieldCheck size={20} />
              <span>角色权限</span>
            </Link>
            <Link to="/system/dictionaries" className="quick-action">
              <BookOpen size={20} />
              <span>字典管理</span>
            </Link>
          </>
        ) : null}
      </section>
    </div>
  )
}
