import {
  BookOpen,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/dashboard', label: '工作台', icon: Home },
  { to: '/system/users', label: '用户管理', icon: Users, roles: ['admin'] },
  { to: '/system/roles', label: '角色权限', icon: ShieldCheck, roles: ['admin'] },
  { to: '/system/dictionaries', label: '字典管理', icon: BookOpen, roles: ['admin'] },
  { to: '/profile', label: '个人资料', icon: User }
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.roles || item.roles.some((roleKey) => auth.hasRole(roleKey))),
    [auth]
  )

  async function handleLogout() {
    await auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Vibe Verse</strong>
            <span>System Console</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="nav-arrow" />
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <button className="icon-btn mobile-only" type="button" title="打开菜单" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">{location.pathname === '/dashboard' ? '工作台' : '平台管理'}</div>
          <div className="topbar-user">
            <span>{auth.userInfo?.nickname || auth.userInfo?.username || '未命名用户'}</span>
            <button className="icon-btn" type="button" title="退出登录" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {sidebarOpen ? (
        <button className="sidebar-mask" type="button" aria-label="关闭菜单" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
      ) : null}
    </div>
  )
}
