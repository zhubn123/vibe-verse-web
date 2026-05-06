import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerApi } from '@/api/auth'

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
    <main className="auth-page">
      <section className="auth-panel wide">
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Vibe Verse</strong>
            <span>System Console</span>
          </div>
        </div>
        <h1>注册账号</h1>
        <form className="form-grid two" onSubmit={handleSubmit}>
          <label className="field">
            <span>用户名</span>
            <input value={form.username} onChange={(event) => updateField('username', event.target.value)} />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span>昵称</span>
            <input value={form.nickname} onChange={(event) => updateField('nickname', event.target.value)} />
          </label>
          <label className="field">
            <span>邮箱</span>
            <input value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </label>
          <label className="field two-span">
            <span>手机</span>
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </label>
          {error ? <div className="form-error two-span">{error}</div> : null}
          <button className="btn primary full two-span" type="submit" disabled={submitting || !form.username || !form.password}>
            <UserPlus size={18} />
            {submitting ? '提交中' : '注册'}
          </button>
        </form>
        <p className="auth-switch">
          已有账号？<Link to="/login">登录</Link>
        </p>
      </section>
    </main>
  )
}
