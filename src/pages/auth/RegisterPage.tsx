import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await registerApi(form)
      navigate('/login?reason=registered', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fbfcff_0%,#f4f7fc_100%)] px-4 py-8">
      <Card className="w-full max-w-[620px] border-border/80 bg-card/95 shadow-[var(--af-shadow)] backdrop-blur">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
            V
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">注册账号</CardTitle>
            <CardDescription className="truncate">Vibe Verse System Console</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="register-username">用户名</Label>
              <Input
                id="register-username"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">密码</Label>
              <Input
                id="register-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-nickname">昵称</Label>
              <Input
                id="register-nickname"
                value={form.nickname}
                onChange={(event) => updateField('nickname', event.target.value)}
                autoComplete="nickname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">邮箱</Label>
              <Input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-phone">手机</Label>
              <Input
                id="register-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                autoComplete="tel"
              />
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {error}
              </div>
            ) : null}
            <Button className="w-full sm:col-span-2" type="submit" disabled={submitting || !form.username || !form.password}>
              <UserPlus className="size-4" />
              {submitting ? '提交中' : '注册'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            已有账号？
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
              登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
