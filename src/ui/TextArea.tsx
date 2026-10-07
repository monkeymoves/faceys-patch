import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from './cx'
import { FieldCount, FieldError, FieldHint, FieldLabel } from './Field'
import { describedBy, nearLimit, useFieldIds } from './field-utils'
import styles from './fields.module.css'

export interface TextAreaProps
  extends Omit<
    ComponentPropsWithRef<'textarea'>,
    'value' | 'onChange' | 'id' | 'children' | 'aria-describedby' | 'rows'
  > {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  hideLabel?: boolean
  maxLength?: number
  /** Starting height in lines. It grows with the text up to maxRows, then scrolls. */
  rows?: number
  maxRows?: number
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  error,
  optional,
  hideLabel,
  maxLength,
  rows = 3,
  maxRows = 14,
  className,
  ...rest
}: TextAreaProps) {
  const ids = useFieldIds()
  const ref = useRef<HTMLTextAreaElement>(null)
  const showCount = nearLimit(value.length, maxLength)

  // Grow to fit the text, within the row limits.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const style = getComputedStyle(el)
    const line = parseFloat(style.lineHeight) || 25
    const chrome =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth)
    el.style.height = 'auto'
    const wanted = Math.max(el.scrollHeight + (parseFloat(style.borderTopWidth) || 0) * 2, rows * line + chrome)
    el.style.height = `${Math.min(wanted, maxRows * line + chrome)}px`
  }, [value, rows, maxRows])

  return (
    <div className={cx(styles.field, className)}>
      <FieldLabel htmlFor={ids.control} hidden={hideLabel} optional={optional}>
        {label}
      </FieldLabel>
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
      <textarea
        ref={ref}
        id={ids.control}
        rows={rows}
        className={styles.textarea}
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
