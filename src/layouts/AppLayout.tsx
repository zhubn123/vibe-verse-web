import {
  BookOpen,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Users
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

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

  const currentTitle = navItems.find((item) => location.pathname === item.to)?.label || '平台管理'
  const displayName = auth.userInfo?.nickname || auth.userInfo?.username || '未命名用户'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfcff_0%,#f4f7fc_100%)] text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-border/80 bg-card/95 shadow-xl backdrop-blur transition-transform duration-200 lg:translate-x-0 lg:shadow-none',
          sidebarOpen && 'translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
            V
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-card-foreground">Vibe Verse</strong>
            <span className="block truncate text-xs text-muted-foreground">System Console</span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="主导航">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--af-brand)]'
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t px-5 py-4">
          <div className="truncate text-xs text-muted-foreground">当前账号</div>
          <div className="mt-1 truncate text-sm font-medium text-card-foreground">{displayName}</div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="打开菜单"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{currentTitle}</div>
            <div className="truncate text-xs text-muted-foreground">Vibe Verse 管理后台</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-[180px] justify-start gap-2 px-2 sm:max-w-[240px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 truncate text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => void handleLogout()}>
                <LogOut className="size-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label="关闭菜单"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  )
}
