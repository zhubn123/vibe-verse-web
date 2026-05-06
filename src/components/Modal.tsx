import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'

interface ModalProps {
  title: string
  open: boolean
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export default function Modal({ title, open, children, footer, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(100vh-12rem)] overflow-auto px-5 py-4">{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
