import type { ComponentPropsWithRef } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './icons'
import styles from './IconButton.module.css'

export type IconButtonVariant = 'ghost' | 'secondary' | 'primary'

export interface IconButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label' | 'aria-labelledby'> {
  icon: IconName
  /** Required: the accessible name, as there is no visible text. */
  label: string
  variant?: IconButtonVariant
  /** md is 44px, lg is 48px. Both meet the touch target minimum. */
  size?: 'md' | 'lg'
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      <Icon name={icon} size={size === 'lg' ? 26 : 24} />
    </button>
  )
}
