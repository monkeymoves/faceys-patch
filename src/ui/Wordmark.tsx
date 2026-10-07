import { cx } from './cx'
import styles from './Wordmark.module.css'

export interface WordmarkProps {
  /** sm 20px, md 26px (header), lg 40px, xl 64px. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/** "Facey's Patch", with a seedling growing where the apostrophe would be. */
export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <span role="img" aria-label="Facey's Patch" className={cx(styles.wordmark, styles[size], className)}>
      <span aria-hidden="true">Facey</span>
      <svg className={styles.sprout} viewBox="0 0 14 20" aria-hidden="true" focusable="false">
        <g className={styles.leafFill}>
          <path d="M6.9 10.6C4.9 6.6 2.1 4.7.5 5.3C.1 7.9 2.6 10.6 6.9 10.6Z" />
          <path d="M7.4 9C8 4.5 10.5 1.4 13.6 1C14.1 4.3 11.5 8.2 7.4 9Z" />
        </g>
        <g className={styles.leafLine}>
          <path d="M6.9 10.6C4.9 6.6 2.1 4.7.5 5.3C.1 7.9 2.6 10.6 6.9 10.6" />
          <path d="M7.4 9C8 4.5 10.5 1.4 13.6 1C14.1 4.3 11.5 8.2 7.4 9" />
        </g>
        <path className={styles.stem} d="M7.3 18.7C6.7 15.6 6.6 12.4 7.2 8.7" />
      </svg>
      <span aria-hidden="true">s Patch</span>
    </span>
  )
}
