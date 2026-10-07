import type { ReactNode } from 'react'
import { Button } from './Button'
import { Sheet } from './Sheet'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Red confirm button, and focus starts on Cancel so a stray Enter is harmless. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} className={styles.button}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} data-autofocus={destructive ? '' : undefined} className={styles.button}>
            {cancelLabel}
          </Button>
        </>
      }
    >
      <div className={styles.message}>{message}</div>
    </Sheet>
  )
}
