interface PaginationProps {
  pageNo: number
  pageSize: number
  total: number
  onChange: (pageNo: number) => void
}

export default function Pagination({ pageNo, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="pagination">
      <span>
        第 {pageNo} / {pages} 页，共 {total} 条
      </span>
      <button className="btn ghost" type="button" disabled={pageNo <= 1} onClick={() => onChange(pageNo - 1)}>
        上一页
      </button>
      <button className="btn ghost" type="button" disabled={pageNo >= pages} onClick={() => onChange(pageNo + 1)}>
        下一页
      </button>
    </div>
  )
}
