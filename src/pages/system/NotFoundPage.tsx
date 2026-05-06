import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="center-state">
      <SearchX size={40} />
      <h1>404</h1>
      <p>页面不存在或已经移动</p>
      <Link className="btn primary" to="/dashboard">
        返回工作台
      </Link>
    </div>
  )
}
