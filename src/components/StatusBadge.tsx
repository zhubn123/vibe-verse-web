export default function StatusBadge({ status }: { status: number | string | undefined }) {
  const enabled = Number(status) === 1
  return <span className={`status-badge ${enabled ? 'is-enabled' : 'is-disabled'}`}>{enabled ? '启用' : '停用'}</span>
}
