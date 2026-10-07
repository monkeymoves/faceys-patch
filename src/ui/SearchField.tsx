import { useId, useRef, type ComponentPropsWithRef } from 'react'
import { cx } from './cx'
import { Icon } from './icons'
import { IconButton } from './IconButton'
import styles from './SearchField.module.css'

export interface SearchFieldProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'onChange' | 'id'> {
  label: string
  value: string
  onChange: (value: string) => void
  /** Keep the label for screen readers only. Use when the context makes it obvious. */
  hideLabel?: boolean
  clearLabel?: string
}

export function SearchField({
  label,
  value,
  onChange,
  hideLabel = false,
  clearLabel = 'Clear search',
  className,
  ...rest
}: SearchFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <Icon name="search" size={22} className={styles.icon} />
        <input
          ref={inputRef}
          id={id}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
        {value !== '' && (
          <IconButton
            icon="close"
            label={clearLabel}
            className={styles.clear}
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
          />
        )}
      </div>
    </div>
  )
}
