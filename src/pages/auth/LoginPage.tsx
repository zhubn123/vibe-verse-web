import { Lock, LogIn, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Vibe Verse</strong>
            <span>System Console</span>
          </div>
        </div>
        <h1>登录</h1>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>用户名</span>
            <div className="input-with-icon">
              <User size={18} />
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </div>
          </label>
          <label className="field">
            <span>密码</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="btn primary full" type="submit" disabled={submitting || !username || !password}>
            <LogIn size={18} />
            {submitting ? '登录中' : '登录'}
          </button>
        </form>
        <p className="auth-switch">
          没有账号？<Link to="/register">注册</Link>
        </p>
      </section>
    </main>
  )
}
