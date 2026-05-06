import { Badge } from './ui/badge'

export default function StatusBadge({ status }: { status: number | string | undefined }) {
  const enabled = Number(status) === 1
  return <Badge variant={enabled ? 'success' : 'muted'}>{enabled ? '启用' : '停用'}</Badge>
}
