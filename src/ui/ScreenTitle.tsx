import type { ReactNode } from 'react'
import { cx } from './cx'
import { HandNote } from './HandNote'
import { UnderlineMark } from './marks'
import styles from './ScreenTitle.module.css'

export interface ScreenTitleProps {
  children: ReactNode
  /** A handwritten aside beside the title, e.g. "ready Sat". Decorative extra, never essential. */
  aside?: ReactNode
  /** Something on the right, e.g. an Add button. */
  action?: ReactNode
  /** h1 by default: there is one per screen. */
  as?: 'h1' | 'h2'
  id?: string
  className?: string
}

/** The screen heading, underlined with a pen stroke. */
export function ScreenTitle({ children, aside, action, as: Heading = 'h1', id, className }: ScreenTitleProps) {
  return (
    <div className={cx(styles.wrap, className)}>
      <div className={styles.titleRow}>
        <Heading id={id} className={styles.title}>
          <span className={styles.text}>
            {children}
            <UnderlineMark className={styles.underline} />
          </span>
        </Heading>
        {aside && (
          <HandNote tone="pencil" className={styles.aside}>
            {aside}
          </HandNote>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
