import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './icons'
import styles from './Badge.module.css'

export type BadgeVariant = 'ready' | 'nearly' | 'shop' | 'soon' | 'glut'

const ICONS: Record<BadgeVariant, IconName> = {
  ready: 'tick',
  nearly: 'basket',
  shop: 'basket',
  soon: 'clock',
  glut: 'glut',
}

export interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

/** A small printed label. Colour is never the only cue: each variant has its own drawn mark. */
export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[variant], className)}>
      <Icon name={ICONS[variant]} size={16} className={styles.icon} />
      {children}
    </span>
  )
}
