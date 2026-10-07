import type { ReactNode } from 'react'
import { cx } from './cx'
import { FieldError, FieldHint } from './Field'
import { describedBy, useFieldIds } from './field-utils'
import styles from './FieldGroup.module.css'

export interface FieldGroupProps {
  legend: string
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  hideLegend?: boolean
  /**
   * Id for the error text, so a control inside can point its aria-describedby
   * at it (the group's own description isn't read when focus lands inside).
   */
  errorId?: string
  className?: string
}

/** A fieldset with a legend, for a set of related controls such as the ingredient rows. */
export function FieldGroup({ legend, hint, error, children, hideLegend = false, errorId, className }: FieldGroupProps) {
  const fieldIds = useFieldIds()
  const ids = { ...fieldIds, error: errorId ?? fieldIds.error }
  return (
    <fieldset
      className={cx(styles.group, className)}
      aria-describedby={describedBy(hint && ids.hint, error && ids.error)}
    >
      <legend className={hideLegend ? 'visually-hidden' : styles.legend}>{legend}</legend>
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
      <div className={styles.body}>{children}</div>
      {error && <FieldError id={ids.error}>{error}</FieldError>}
    </fieldset>
  )
}
