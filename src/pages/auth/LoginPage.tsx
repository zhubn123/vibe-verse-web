import { Lock, LogIn, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('redirect') || '/dashboard'
  }, [location.search])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await auth.login({ username, password })
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fbfcff_0%,#f4f7fc_100%)] px-4 py-8">
      <Card className="w-full max-w-[420px] border-border/80 bg-card/95 shadow-[var(--af-shadow)] backdrop-blur">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
            V
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">登录</CardTitle>
            <CardDescription className="truncate">Vibe Verse System Console</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  className="pl-9"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  className="pl-9"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button className="w-full" type="submit" disabled={submitting || !username || !password}>
              <LogIn className="size-4" />
              {submitting ? '登录中' : '登录'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            没有账号？
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/register">
              注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
