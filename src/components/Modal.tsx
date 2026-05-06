import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  open: boolean
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export default function Modal({ title, open, children, footer, onClose }: ModalProps) {
  if (!open) {
    return null
  }
  return (
    <div className="modal-layer" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" type="button" title="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
