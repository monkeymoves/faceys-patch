import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './Page.module.css'

export interface PageProps {
  children: ReactNode
  className?: string
}

/**
 * The screen column: centred, at most 640px, with side gutters and room at the
 * bottom for the phone tab bar. Wrap each screen's content in one.
 */
export function Page({ children, className }: PageProps) {
  return <div className={cx(styles.page, className)}>{children}</div>
}
