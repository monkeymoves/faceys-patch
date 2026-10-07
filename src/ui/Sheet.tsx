import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { IconButton } from './IconButton'
import styles from './Sheet.module.css'

export interface SheetProps {
  open: boolean
  /** Called for the close button, Escape and a tap on the backdrop. Set open to false in response. */
  onClose: () => void
  title: string
  children: ReactNode
  /** Actions pinned to the bottom, e.g. Save and Cancel. */
  footer?: ReactNode
  closeLabel?: string
}

function restoreFocus(saved: RefObject<HTMLElement | null>) {
  const target = saved.current
  saved.current = null
  if (target?.isConnected) target.focus()
}

/**
 * A bottom sheet on phones and a centred dialog from 900px, built on a native
 * modal <dialog> (focus trap and Escape for free). Focus returns to whatever was
 * focused before it opened. To focus something other than the close button on
 * open, give that element a data-autofocus attribute.
 * Children only render while open, so a form inside starts fresh each time.
 */
export function Sheet({ open, onClose, title, children, footer, closeLabel = 'Close' }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // If the sheet is unmounted while open, still hand focus back.
  useEffect(() => {
    const dialog = dialogRef.current
    return () => {
      if (dialog && !dialog.isConnected) restoreFocus(returnFocusTo)
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={() => {
        restoreFocus(returnFocusTo)
        // Closed by the browser itself (e.g. a second Escape): tell the owner.
        if (open) onClose()
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onClose()
        pressedBackdrop.current = false
      }}
    >
      <div className={styles.frame}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton icon="close" label={closeLabel} onClick={onClose} className={styles.close} />
        </header>
        <div className={styles.body}>{open && children}</div>
        {open && footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
  )
}
