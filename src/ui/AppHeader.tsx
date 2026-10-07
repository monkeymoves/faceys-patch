import type { ReactNode } from 'react'
import { Wordmark } from './Wordmark'
import styles from './AppHeader.module.css'

export interface AppHeaderProps {
  /** Right-hand actions, e.g. the settings IconButton. */
  actions?: ReactNode
  /** The TabBar. On phones it is fixed to the bottom; from 900px it sits here. */
  nav?: ReactNode
}

export function AppHeader({ actions, nav }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Wordmark size="md" className={styles.wordmark} />
        {nav && <div className={styles.nav}>{nav}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  )
}
