import { cx } from './cx'
import { Icon, type IconName } from './icons'
import { BlobMark, RingMark } from './marks'
import styles from './TabBar.module.css'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon: IconName
}

/** The app's five tabs, in order, with their drawn icons. */
export const MAIN_TABS = [
  { id: 'patch', label: 'Patch', icon: 'trowel' },
  { id: 'larder', label: 'Larder', icon: 'jar' },
  { id: 'cook', label: 'Cook', icon: 'pot' },
  { id: 'week', label: 'Week', icon: 'calendar' },
  { id: 'shop', label: 'Shop', icon: 'basket' },
] as const satisfies readonly TabItem[]

export type MainTabId = (typeof MAIN_TABS)[number]['id']

export interface TabBarProps<T extends string> {
  tabs: readonly TabItem<T>[]
  active: T
  onSelect: (id: T) => void
  /** Accessible name for the navigation landmark. */
  label?: string
}

/**
 * Bottom bar on phones (clear of the iOS home indicator); from 900px it sits
 * inline, so place it in AppHeader's nav slot. The active tab is ringed in pencil.
 */
export function TabBar<T extends string>({ tabs, active, onSelect, label = 'Main' }: TabBarProps<T>) {
  return (
    <nav aria-label={label} className={styles.bar}>
      <ul role="list" className={styles.list}>
        {tabs.map((tab) => {
          const current = tab.id === active
          return (
            <li key={tab.id} className={styles.item}>
              <button
                type="button"
                className={cx(styles.tab, current && styles.current)}
                aria-current={current ? 'page' : undefined}
                onClick={() => onSelect(tab.id)}
              >
                <span className={styles.iconWrap}>
                  {current && <BlobMark className={styles.blob} />}
                  <Icon name={tab.icon} size={26} className={styles.icon} />
                  {current && <RingMark className={styles.ring} />}
                </span>
                <span className={styles.label}>{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
