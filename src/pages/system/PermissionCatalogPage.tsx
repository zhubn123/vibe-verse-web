import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listPermissionCatalogApi, type PermissionGroup } from '@/api/role'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PermissionCatalogPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredGroups = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) {
      return groups
    }
    return groups
      .map((group) => {
        const groupMatched = group.module.toLowerCase().includes(text) || group.moduleName.toLowerCase().includes(text)
        return {
          ...group,
          permissions: groupMatched
            ? group.permissions
            : group.permissions.filter((permission) =>
                [permission.permKey, permission.permName, permission.moduleName, permission.action, permission.remark]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(text))
              )
        }
      })
      .filter((group) => group.permissions.length > 0 || group.module.toLowerCase().includes(text) || group.moduleName.toLowerCase().includes(text))
  }, [groups, keyword])

  useEffect(() => {
    void fetchPermissions()
  }, [])

  async function fetchPermissions() {
    setLoading(true)
    setError('')
    try {
      const result = await listPermissionCatalogApi()
      setGroups(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载权限目录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="权限目录"
        description="查看系统内置权限分组和权限项。"
        actions={
          <Button variant="outline" type="button" onClick={() => void fetchPermissions()}>
            <RefreshCw />
            刷新
          </Button>
        }
      />

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="permission-keyword">关键字</Label>
              <Input
                id="permission-keyword"
                placeholder="搜索权限名称、权限码或模块"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <Badge variant="outline" className="w-fit bg-background text-muted-foreground">
              {groups.reduce((total, group) => total + group.permissions.length, 0)} 项权限
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {loading ? <Card className="border-blue-100/80 bg-card/95 p-10 text-center text-sm text-muted-foreground shadow-sm">加载中...</Card> : null}

      {!loading && filteredGroups.length === 0 ? (
        <Card className="border-blue-100/80 bg-card/95 shadow-sm">
          <EmptyState text={keyword ? '没有匹配的权限项' : '暂无权限目录'} />
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredGroups.map((group) => (
          <Card key={group.module} className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-slate-50/70">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{group.moduleName}</CardTitle>
                <p className="mt-1 truncate text-xs text-muted-foreground">{group.module}</p>
              </div>
              <Badge variant="outline" className="bg-background text-muted-foreground">
                {group.permissions.length} 项
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 p-4">
              {group.permissions.map((permission) => (
                <div key={permission.permKey} className="rounded-lg border border-border bg-background/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 shrink-0 text-blue-600" />
                        <span className="truncate text-sm font-medium text-foreground">{permission.permName}</span>
                      </div>
                      <div className="mt-2 font-mono text-xs text-muted-foreground">{permission.permKey}</div>
                    </div>
                    <Badge variant={permission.status === 1 ? 'success' : 'muted'}>{permission.status === 1 ? '正常' : '停用'}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-slate-50 text-muted-foreground">
                      {permission.action || '-'}
                    </Badge>
                    {permission.remark ? (
                      <span className="min-w-0 truncate text-xs text-muted-foreground">{permission.remark}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
