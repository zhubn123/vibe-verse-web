import { BookOpen, ChevronRight, KeyRound, ShieldCheck, User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'

const adminActions = [
  { title: '用户管理', description: '维护账号资料、状态和角色', to: '/system/users', icon: Users },
  { title: '角色权限', description: '管理角色与权限范围', to: '/system/roles', icon: ShieldCheck },
  { title: '字典管理', description: '维护系统字典和选项', to: '/system/dictionaries', icon: BookOpen }
]

export default function DashboardPage() {
  const auth = useAuth()
  const isAdmin = auth.hasRole('admin')
  const displayName = auth.userInfo?.nickname || auth.userInfo?.username || '-'
  const roleText = auth.roles.length ? auth.roles.join(', ') : '-'

  return (
    <div className="space-y-6">
      <PageHeader title="工作台" description="查看当前账号状态，快速进入常用系统能力。" />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription>当前用户</CardDescription>
            <div className="rounded-md bg-blue-50 p-2 text-blue-600">
              <User className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-semibold text-foreground">{displayName}</div>
            <p className="mt-2 text-sm text-muted-foreground">{auth.userInfo?.username || '登录信息已同步'}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription>角色</CardDescription>
            <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
              <KeyRound className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-semibold text-foreground">{roleText}</div>
            <p className="mt-2 text-sm text-muted-foreground">权限范围由角色配置控制</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription>系统管理</CardDescription>
            <Badge variant={isAdmin ? 'success' : 'muted'}>{isAdmin ? '可访问' : '未授权'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{isAdmin ? '已开启' : '受限'}</div>
            <p className="mt-2 text-sm text-muted-foreground">管理员可维护用户、角色和字典</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardHeader>
            <CardTitle>快捷入口</CardTitle>
            <CardDescription>进入个人资料或常用系统管理页面。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/profile"
              className="group flex items-center justify-between rounded-lg border border-border bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className="flex items-center gap-3">
                <span className="rounded-md bg-blue-50 p-2 text-blue-600">
                  <User className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">个人资料</span>
                  <span className="mt-1 block text-xs text-muted-foreground">资料与密码</span>
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>

            {isAdmin
              ? adminActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="group flex items-center justify-between rounded-lg border border-border bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-md bg-blue-50 p-2 text-blue-600">
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-foreground">{action.title}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{action.description}</span>
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  )
                })
              : null}
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardHeader>
            <CardTitle>平台状态</CardTitle>
            <CardDescription>当前系统底座已保留认证、权限和基础字典能力。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['认证状态', '已登录'],
              ['权限模型', '角色 + 权限码'],
              ['业务模块', '等待接入']
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
