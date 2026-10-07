import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from './cx'
import { TickBoxMark } from './marks'
import styles from './Checkbox.module.css'

export interface CheckboxProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'checked' | 'onChange' | 'children'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: ReactNode
  /** Quieter second line, e.g. 'for Courgette fritters'. Read as the description. */
  hint?: ReactNode
  /** Cross the label out when ticked, like a shopping list. */
  strike?: boolean
}

/** A native checkbox drawn as an inked box with a tick that overshoots it. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  hint,
  strike = false,
  className,
  ...rest
}: CheckboxProps) {
  const labelId = useId()
  const hintId = useId()
  return (
    <label className={cx(styles.row, strike && checked && styles.struck, className)}>
      <span className={styles.boxWrap}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          {...rest}
        />
        <TickBoxMark className={styles.box} tickClassName={styles.tick} />
      </span>
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}
