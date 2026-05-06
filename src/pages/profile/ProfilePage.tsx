import { KeyRound, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProfileApi, updatePasswordApi, updateProfileApi, type ProfileInfo } from '@/api/user'
import PageHeader from '@/components/PageHeader'
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

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
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

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
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
    <div className="page-stack">
      <PageHeader title="个人资料" description="维护当前登录账号的基础信息和密码。" />
      {message ? <div className="notice success">{message}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}
      {loading ? (
        <div className="panel">加载中...</div>
      ) : (
        <div className="split-grid">
          <form className="panel form-grid" onSubmit={saveProfile}>
            <h2>基础信息</h2>
            <label className="field">
              <span>用户名</span>
              <input value={profile?.username || ''} disabled />
            </label>
            <label className="field">
              <span>昵称</span>
              <input value={profile?.nickname || ''} onChange={(event) => updateField('nickname', event.target.value)} />
            </label>
            <label className="field">
              <span>邮箱</span>
              <input value={profile?.email || ''} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label className="field">
              <span>手机</span>
              <input value={profile?.phone || ''} onChange={(event) => updateField('phone', event.target.value)} />
            </label>
            <button className="btn primary" type="submit">
              <Save size={18} />
              保存资料
            </button>
          </form>
          <form className="panel form-grid" onSubmit={savePassword}>
            <h2>修改密码</h2>
            <label className="field">
              <span>原密码</span>
              <input
                type="password"
                value={password.oldPassword}
                onChange={(event) => setPassword((current) => ({ ...current, oldPassword: event.target.value }))}
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              <span>新密码</span>
              <input
                type="password"
                value={password.newPassword}
                onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))}
                autoComplete="new-password"
              />
            </label>
            <button className="btn primary" type="submit" disabled={!password.oldPassword || !password.newPassword}>
              <KeyRound size={18} />
              更新密码
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
