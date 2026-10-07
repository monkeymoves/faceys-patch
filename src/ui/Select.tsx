import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from './cx'
import { FieldError, FieldHint, FieldLabel } from './Field'
import { describedBy, useFieldIds } from './field-utils'
import { Icon } from './icons'
import styles from './fields.module.css'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export interface SelectProps<T extends string>
  extends Omit<ComponentPropsWithRef<'select'>, 'value' | 'onChange' | 'id' | 'children' | 'aria-describedby'> {
  label: string
  options: readonly SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  hideLabel?: boolean
}

/** A native select, styled to match the text fields. */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  optional,
  hideLabel,
  className,
  ...rest
}: SelectProps<T>) {
  const ids = useFieldIds()
  return (
    <div className={cx(styles.field, className)}>
      <FieldLabel htmlFor={ids.control} hidden={hideLabel} optional={optional}>
        {label}
      </FieldLabel>
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
      <div className={styles.selectWrap}>
        <select
          id={ids.control}
          className={styles.select}
          value={value}
          onChange={(event) => {
            const next = options.find((option) => option.value === event.target.value)
            if (next) onChange(next.value)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && ids.hint, error && ids.error)}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronRight" size={20} className={styles.selectIcon} />
      </div>
      {error && <FieldError id={ids.error}>{error}</FieldError>}
    </div>
  )
}
