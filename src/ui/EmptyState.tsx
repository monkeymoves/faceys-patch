import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Usually a drawing: <Art name="seedling" size={96} />. */
  art?: ReactNode
  title: string
  /** One short line. */
  children?: ReactNode
  action?: ReactNode
  headingLevel?: 2 | 3
  className?: string
}

export function EmptyState({ art, title, children, action, headingLevel = 2, className }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <div className={cx(styles.empty, className)}>
      {art && <div className={styles.art}>{art}</div>}
      <Heading className={styles.title}>{title}</Heading>
      {children && <p className={styles.text}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
