import { Button } from './ui/button'

interface PaginationProps {
  pageNo: number
  pageSize: number
  total: number
  onChange: (pageNo: number) => void
}

export default function Pagination({ pageNo, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
      <span className="mr-auto">
        第 {pageNo} / {pages} 页，共 {total} 条
      </span>
      <Button variant="outline" size="sm" type="button" disabled={pageNo <= 1} onClick={() => onChange(pageNo - 1)}>
        上一页
      </Button>
      <Button variant="outline" size="sm" type="button" disabled={pageNo >= pages} onClick={() => onChange(pageNo + 1)}>
        下一页
      </Button>
    </div>
  )
}
