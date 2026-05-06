import { ShieldX } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function ForbiddenPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const message = params.get('message') || '当前账号没有访问权限'

  return (
    <div className="center-state">
      <ShieldX size={40} />
      <h1>403</h1>
      <p>{message}</p>
      <Link className="btn primary" to="/dashboard">
        返回工作台
      </Link>
    </div>
  )
}
