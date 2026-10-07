import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from './cx'
import { FieldCount, FieldError, FieldHint, FieldLabel } from './Field'
import { describedBy, nearLimit, useFieldIds } from './field-utils'
import styles from './fields.module.css'

export interface TextFieldProps
  extends Omit<ComponentPropsWithRef<'input'>, 'value' | 'onChange' | 'id' | 'children' | 'aria-describedby'> {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  /** Shown under the field in tomato, and marks the input aria-invalid. */
  error?: ReactNode
  /** Adds a quiet "(optional)" after the label. */
  optional?: boolean
  hideLabel?: boolean
  /** Hard limit; a quiet "38 of 60" count appears near it. */
  maxLength?: number
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  optional,
  hideLabel,
  maxLength,
  className,
  type = 'text',
  ...rest
}: TextFieldProps) {
  const ids = useFieldIds()
  const showCount = nearLimit(value.length, maxLength)
  return (
    <div className={cx(styles.field, className)}>
      <FieldLabel htmlFor={ids.control} hidden={hideLabel} optional={optional}>
        {label}
      </FieldLabel>
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
      <input
        id={ids.control}
        type={type}
        className={styles.input}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && ids.hint, error && ids.error, showCount && ids.count)}
        {...rest}
      />
      {(error || showCount) && (
        <div className={styles.below}>
          {error && <FieldError id={ids.error}>{error}</FieldError>}
          {showCount && maxLength !== undefined && (
            <FieldCount id={ids.count} length={value.length} maxLength={maxLength} />
          )}
        </div>
      )}
    </div>
  )
}
