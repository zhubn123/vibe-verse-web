import { Download, Eye, RefreshCw, Search, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  deleteOssObjectsApi,
  downloadOssObjectApi,
  getOssObjectDetailApi,
  queryOssObjectPage,
  uploadOssObjectApi,
  type OssObjectQuery,
  type OssObjectRecord
} from '@/api/oss'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import type { PageResult } from '@/types/common'

const ALL_BUCKET_VALUE = '__all_bucket__'
const ALL_STATUS_VALUE = '__all_status__'

const bucketOptions = ['avatar', 'import', 'export', 'attachment', 'archive']

const defaultQuery: OssObjectQuery = {
  pageNo: 1,
  pageSize: 10,
  bucket: '',
  originalName: '',
  contentType: '',
  status: ''
}

function formatFileSize(size?: number): string {
  const value = Number(size || 0)
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`
  }
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function StatusBadge({ status }: { status: number | undefined }) {
  const enabled = Number(status) === 1
  return <Badge variant={enabled ? 'success' : 'muted'}>{enabled ? '正常' : '停用'}</Badge>
}

function isPreviewableFile(record: OssObjectRecord): boolean {
  const contentType = (record.contentType || '').toLowerCase()
  if (
    contentType === 'application/pdf' ||
    contentType.startsWith('image/') ||
    contentType.startsWith('text/') ||
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/')
  ) {
    return true
  }

  const extension = (record.extension || '').toLowerCase()
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'csv', 'json', 'xml'].includes(extension)
}

export default function FileManagementPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission('system:oss:manage')
  const [query, setQuery] = useState<OssObjectQuery>(defaultQuery)
  const [page, setPage] = useState<PageResult<OssObjectRecord>>({ pageNo: 1, pageSize: 10, total: 0, pages: 0, records: [] })
  const [uploadBucket, setUploadBucket] = useState('attachment')
  const [uploadRemark, setUploadRemark] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<OssObjectRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return ''
    }
    return `${selectedFile.name} - ${formatFileSize(selectedFile.size)}`
  }, [selectedFile])

  useEffect(() => {
    void fetchObjects()
  }, [query.pageNo, query.pageSize, query.bucket, query.status])

  async function fetchObjects(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const result = await queryOssObjectPage({
        ...nextQuery,
        bucket: nextQuery.bucket || undefined,
        originalName: nextQuery.originalName || undefined,
        contentType: nextQuery.contentType || undefined,
        status: nextQuery.status === '' ? undefined : nextQuery.status
      })
      setPage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFile) {
      setError('请选择要上传的文件')
      return
    }
    setUploading(true)
    setError('')
    try {
      await uploadOssObjectApi({
        file: selectedFile,
        bucket: uploadBucket,
        remark: uploadRemark || undefined
      })
      setSelectedFile(null)
      setUploadRemark('')
      const nextQuery = { ...query, pageNo: 1, bucket: uploadBucket }
      setQuery(nextQuery)
      await fetchObjects(nextQuery)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传文件失败')
    } finally {
      setUploading(false)
    }
  }

  async function downloadFile(record: OssObjectRecord) {
    setError('')
    try {
      const result = await downloadOssObjectApi(record.id)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename || record.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载文件失败')
    }
  }

  async function previewFile(record: OssObjectRecord) {
    setError('')
    if (!isPreviewableFile(record)) {
      await openFileDetail(record)
      return
    }
    try {
      const result = await downloadOssObjectApi(record.id, true)
      const url = URL.createObjectURL(result.blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览文件失败')
    }
  }

  async function openFileDetail(record: OssObjectRecord) {
    setDetailRecord(record)
    setDetailOpen(true)
    try {
      setDetailRecord(await getOssObjectDetailApi(record.id))
    } catch {
      setDetailRecord(record)
    }
  }

  async function deleteFile(record: OssObjectRecord) {
    if (!window.confirm(`确认删除文件 ${record.originalName}？`)) {
      return
    }
    setError('')
    try {
      await deleteOssObjectsApi([record.id])
      await fetchObjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文件失败')
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = { ...query, pageNo: 1 }
    setQuery(nextQuery)
    void fetchObjects(nextQuery)
  }

  function resetSearch() {
    setQuery(defaultQuery)
    void fetchObjects(defaultQuery)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="文件管理" description="上传、查询和维护通用对象存储文件。" />

      {canManage ? (
        <Card className="border-blue-100/80 bg-card/95 shadow-sm">
          <CardContent className="p-4">
            <form className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={uploadFile}>
              <div className="space-y-2">
                <Label>bucket</Label>
                <Select value={uploadBucket} onValueChange={setUploadBucket}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bucketOptions.map((bucket) => (
                      <SelectItem key={bucket} value={bucket}>
                        {bucket}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oss-upload-file">文件</Label>
                <Input
                  id="oss-upload-file"
                  type="file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oss-upload-remark">备注</Label>
                <Input
                  id="oss-upload-remark"
                  value={uploadRemark}
                  maxLength={255}
                  placeholder={selectedFileSummary || '可选'}
                  onChange={(event) => setUploadRemark(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full md:w-auto" type="submit" disabled={uploading || !selectedFile}>
                  <Upload />
                  {uploading ? '上传中...' : '上传'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-blue-100/80 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_140px_auto]" onSubmit={submitSearch}>
            <div className="space-y-2">
              <Label>bucket</Label>
              <Select
                value={query.bucket || ALL_BUCKET_VALUE}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    bucket: value === ALL_BUCKET_VALUE ? '' : value,
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_BUCKET_VALUE}>全部</SelectItem>
                  {bucketOptions.map((bucket) => (
                    <SelectItem key={bucket} value={bucket}>
                      {bucket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oss-search-name">文件名</Label>
              <Input
                id="oss-search-name"
                placeholder="请输入文件名"
                value={query.originalName}
                onChange={(event) => setQuery((current) => ({ ...current, originalName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oss-search-type">类型</Label>
              <Input
                id="oss-search-type"
                placeholder="如 image/png"
                value={query.contentType}
                onChange={(event) => setQuery((current) => ({ ...current, contentType: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={query.status === '' ? ALL_STATUS_VALUE : String(query.status)}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    status: value === ALL_STATUS_VALUE ? '' : Number(value),
                    pageNo: 1
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>全部</SelectItem>
                  <SelectItem value="1">正常</SelectItem>
                  <SelectItem value="0">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
              <Button className="flex-1 xl:flex-none" type="submit">
                <Search />
                查询
              </Button>
              <Button className="flex-1 xl:flex-none" variant="outline" type="button" onClick={resetSearch}>
                <RefreshCw />
                重置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card className="overflow-hidden border-blue-100/80 bg-card/95 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/90">
            <TableRow className="hover:bg-slate-50/90">
              <TableHead className="min-w-56">文件名</TableHead>
              <TableHead className="w-32">bucket</TableHead>
              <TableHead className="min-w-36">类型</TableHead>
              <TableHead className="w-28">大小</TableHead>
              <TableHead className="min-w-48">校验和</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-40">上传时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.records.map((record) => (
              <TableRow key={String(record.id)}>
                <TableCell>
                  <div className="max-w-80 truncate font-medium text-foreground" title={record.originalName}>
                    {record.originalName}
                  </div>
                  <div className="mt-1 max-w-80 truncate font-mono text-xs text-muted-foreground" title={record.objectKey}>
                    {record.objectKey}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-muted-foreground">
                    {record.bucket}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{record.contentType || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{formatFileSize(record.size)}</TableCell>
                <TableCell>
                  <span className="block max-w-48 truncate font-mono text-xs text-muted-foreground" title={record.checksumSha256 || ''}>
                    {record.checksumSha256 || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{record.createTime || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" type="button" title="预览" aria-label="预览" onClick={() => previewFile(record)}>
                      <Eye />
                    </Button>
                    <Button variant="ghost" size="icon" type="button" title="下载" aria-label="下载" onClick={() => downloadFile(record)}>
                      <Download />
                    </Button>
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        title="删除"
                        aria-label="删除"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteFile(record)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && page.records.length === 0 ? <EmptyState text="暂无文件" /> : null}
        {loading ? <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">加载中...</div> : null}
        <Pagination
          pageNo={page.pageNo}
          pageSize={page.pageSize}
          total={page.total}
          onChange={(pageNo) => setQuery((current) => ({ ...current, pageNo }))}
        />
      </Card>

      <Modal
        title="文件详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
            {detailRecord ? (
              <Button type="button" onClick={() => downloadFile(detailRecord)}>
                <Download />
                下载文件
              </Button>
            ) : null}
          </>
        }
      >
        {detailRecord ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              当前文件类型不支持浏览器直接预览。
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">文件名</div>
                <div className="mt-1 break-all font-medium text-foreground">{detailRecord.originalName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">bucket</div>
                <div className="mt-1 text-foreground">{detailRecord.bucket}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">类型</div>
                <div className="mt-1 text-foreground">{detailRecord.contentType || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">大小</div>
                <div className="mt-1 text-foreground">{formatFileSize(detailRecord.size)}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">对象 key</div>
                <div className="mt-1 break-all font-mono text-xs text-foreground">{detailRecord.objectKey}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">SHA-256</div>
                <div className="mt-1 break-all font-mono text-xs text-foreground">{detailRecord.checksumSha256 || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">上传时间</div>
                <div className="mt-1 text-foreground">{detailRecord.createTime || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">备注</div>
                <div className="mt-1 text-foreground">{detailRecord.remark || '-'}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
