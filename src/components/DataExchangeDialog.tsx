import { Download, FileDown, FileUp } from 'lucide-react'
import { useState } from 'react'
import {
  downloadTemplateApi,
  exportBySceneApi,
  importBySceneApi,
  type DataExchangeTaskRecord
} from '@/api/data-exchange'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Modal from './Modal'

interface DataExchangeDialogProps {
  scene: string
  title: string
  mode: 'import' | 'export'
  open: boolean
  onClose: () => void
  onSuccess?: (task: DataExchangeTaskRecord) => void
  queryParams?: Record<string, unknown>
  accept?: string
  hint?: string
}

function downloadBrowserFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function DataExchangeDialog({
  scene,
  title,
  mode,
  open,
  onClose,
  onSuccess,
  queryParams,
  accept = '.csv,text/csv',
  hint
}: DataExchangeDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setFile(null)
    setRemark('')
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleDownloadTemplate() {
    setError('')
    try {
      const result = await downloadTemplateApi(scene)
      downloadBrowserFile(result.blob, result.filename || scene + '-template.csv')
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载模板失败')
    }
  }

  async function handleImport() {
    if (!file) {
      setError('请选择导入文件')
      return
    }
    setLoading(true)
    setError('')
    try {
      const task = await importBySceneApi(scene, file, remark || undefined)
      handleClose()
      onSuccess?.(task)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      const result = await exportBySceneApi(scene, queryParams as Record<string, string>)
      downloadBrowserFile(result.blob, result.filename || scene + '.csv')
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onClose={handleClose}
      footer={
        mode === 'import' ? (
          <>
            <Button variant="outline" type="button" onClick={handleClose}>
              取消
            </Button>
            <Button type="button" disabled={loading || !file} onClick={() => void handleImport()}>
              <FileUp />
              {loading ? '导入中...' : '开始导入'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" type="button" onClick={handleClose}>
              取消
            </Button>
            <Button type="button" disabled={loading} onClick={() => void handleExport()}>
              <FileDown />
              {loading ? '导出中...' : '确认导出'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {mode === 'import' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="exchange-import-file">导入文件</Label>
              <Input
                id="exchange-import-file"
                type="file"
                accept={accept}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-import-remark">备注</Label>
              <Input
                id="exchange-import-remark"
                value={remark}
                maxLength={255}
                placeholder="可选"
                onChange={(event) => setRemark(event.target.value)}
              />
            </div>
            <Button variant="link" type="button" className="h-auto px-0 text-xs" onClick={() => void handleDownloadTemplate()}>
              <Download className="mr-1 h-3 w-3" />
              下载导入模板
            </Button>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">确认导出数据？导出完成后文件将自动下载。</div>
        )}
        {hint ? (
          <div className="rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-700">
            {hint}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
