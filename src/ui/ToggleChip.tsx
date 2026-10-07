import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from './cx'
import { ChipMark } from './marks'
import styles from './ToggleChip.module.css'

export interface ToggleChipProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'onChange' | 'aria-pressed'> {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  children: ReactNode
}

/** An on/off chip, e.g. a larder item or a filter. Shows a tick when on, a loop when off. */
export function ToggleChip({
  pressed,
  onPressedChange,
  className,
  children,
  type = 'button',
  onClick,
  ...rest
}: ToggleChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cx(styles.chip, pressed && styles.on, className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onPressedChange(!pressed)
      }}
      {...rest}
    >
      <ChipMark on={pressed} className={styles.mark} />
      <span>{children}</span>
    </button>
  )
}
