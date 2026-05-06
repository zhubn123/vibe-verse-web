import { Home, ShieldX } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ForbiddenPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const message = params.get('message') || '当前账号没有访问权限'

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-blue-100 bg-white/90 text-center shadow-[var(--af-shadow)]">
        <CardContent className="flex flex-col items-center p-8">
          <div className="mb-5 rounded-full bg-red-50 p-4 text-red-600">
            <ShieldX className="size-9" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">403</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">访问受限</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">
              <Home className="size-4" />
              返回工作台
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
