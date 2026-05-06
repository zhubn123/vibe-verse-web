export default function EmptyState({ text = '暂无数据' }: { text?: string }) {
  return <div className="px-6 py-12 text-center text-sm text-muted-foreground">{text}</div>
}
