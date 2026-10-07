import { useId, type ReactNode } from 'react'
import { Button } from './Button'
import type { IconName } from './icons'
import { Sheet } from './Sheet'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What will happen. Read out with the title, as the dialog's description. */
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Red confirm button, and focus starts on Cancel so a stray Enter is harmless. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** A third choice, e.g. "Download a backup first". Sits between confirm and cancel; the dialog stays open. */
  otherAction?: { label: string; icon?: IconName; onClick: () => void }
}

/** An alert dialog asking "Are you sure?", with the consequence spelt out. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  otherAction,
}: ConfirmDialogProps) {
  const messageId = useId()
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      describedBy={messageId}
      footer={
        <>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} className={styles.button}>
            {confirmLabel}
          </Button>
          {otherAction && (
            <Button variant="secondary" icon={otherAction.icon} onClick={otherAction.onClick} className={styles.button}>
              {otherAction.label}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onCancel}
            data-autofocus={destructive ? '' : undefined}
            className={styles.button}
          >
            {cancelLabel}
          </Button>
        </>
      }
    >
      <div id={messageId} className={styles.message}>
        {message}
      </div>
    </Sheet>
  )
}
