/* Internal: the label, hint, error and count around a form control. */
import type { ReactNode } from 'react'
import { Icon } from './icons'
import styles from './fields.module.css'

export function FieldLabel({
  htmlFor,
  id,
  hidden,
  optional,
  children,
}: {
  htmlFor?: string
  id?: string
  hidden?: boolean
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} id={id} className={hidden ? 'visually-hidden' : styles.label}>
      {children}
      {optional && <span className={styles.optional}> (optional)</span>}
    </label>
  )
}

export function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={styles.hint}>
      {children}
    </p>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={styles.error}>
      <Icon name="alert" size={18} />
      <span>{children}</span>
    </p>
  )
}

export function FieldCount({ id, length, maxLength }: { id: string; length: number; maxLength: number }) {
  return (
    <p id={id} className={styles.count}>
      {length} of {maxLength}
    </p>
  )
}
