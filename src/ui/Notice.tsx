import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './icons'
import { IconButton } from './IconButton'
import styles from './Notice.module.css'

export type NoticeTone = 'info' | 'success' | 'problem'

const ICONS: Record<NoticeTone, IconName> = { info: 'info', success: 'tick', problem: 'alert' }

export interface NoticeProps {
  tone?: NoticeTone
  title?: string
  children: ReactNode
  /** e.g. a small Button: "Download the copy". */
  action?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

/** An inline message. Problems use role="alert" so they're announced at once; others are polite. */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: NoticeProps) {
  return (
    <div role={tone === 'problem' ? 'alert' : 'status'} className={cx(styles.notice, styles[tone], className)}>
      <Icon name={ICONS[tone]} size={24} className={styles.icon} />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.text}>{children}</div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {onDismiss && <IconButton icon="close" label={dismissLabel} onClick={onDismiss} className={styles.dismiss} />}
    </div>
  )
}
