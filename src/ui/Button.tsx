import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './icons'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** A drawn icon before the label. */
  icon?: IconName
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], fullWidth && styles.full, className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 20} />}
      <span className={styles.label}>{children}</span>
    </button>
  )
}
