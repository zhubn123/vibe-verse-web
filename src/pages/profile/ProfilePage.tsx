import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle, Save, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { getProfileApi, updatePasswordApi, updateProfileApi, type ProfileInfo } from '@/api/user'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'

export default function ProfilePage() {
  const auth = useAuth()
  const [profile, setProfile] = useState<ProfileInfo | null>(null)
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfileApi()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : '加载资料失败'))
      .finally(() => setLoading(false))
  }, [])

  function updateField(field: keyof ProfileInfo, value: string) {
    setProfile((current) => (current ? { ...current, [field]: value } : current))
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) {
      return
    }
    setMessage('')
    setError('')
    try {
      await updateProfileApi(profile)
      auth.setUserInfo(profile)
      setMessage('资料已保存')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存资料失败')
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await updatePasswordApi(password)
      setPassword({ oldPassword: '', newPassword: '' })
      setMessage('密码已更新')
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改密码失败')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="个人资料" description="维护当前登录账号的基础信息和密码。" />

      {message ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
          <CardContent className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            加载中...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
            <form onSubmit={saveProfile}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                    <UserRound className="size-4" />
                  </div>
                  <div>
                    <CardTitle>基础信息</CardTitle>
                    <CardDescription className="mt-1">更新昵称、邮箱和手机号。</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="profile-username">用户名</Label>
                  <Input id="profile-username" value={profile?.username || ''} disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-nickname">昵称</Label>
                  <Input
                    id="profile-nickname"
                    value={profile?.nickname || ''}
                    onChange={(event) => updateField('nickname', event.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">邮箱</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profile?.email || ''}
                      onChange={(event) => updateField('email', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-phone">手机</Label>
                    <Input
                      id="profile-phone"
                      value={profile?.phone || ''}
                      onChange={(event) => updateField('phone', event.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-5">
                <Button type="submit" disabled={!profile}>
                  <Save className="size-4" />
                  保存资料
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-blue-100 bg-white/90 shadow-[var(--af-shadow-soft)]">
            <form onSubmit={savePassword}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <CardTitle>修改密码</CardTitle>
                    <CardDescription className="mt-1">提交后请使用新密码登录。</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="profile-old-password">原密码</Label>
                  <Input
                    id="profile-old-password"
                    type="password"
                    value={password.oldPassword}
                    onChange={(event) => setPassword((current) => ({ ...current, oldPassword: event.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-new-password">新密码</Label>
                  <Input
                    id="profile-new-password"
                    type="password"
                    value={password.newPassword}
                    onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">建议使用不易猜测的密码，并定期更新。</p>
              </CardContent>
              <CardFooter className="justify-end border-t pt-5">
                <Button type="submit" disabled={!password.oldPassword || !password.newPassword}>
                  <KeyRound className="size-4" />
                  更新密码
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
