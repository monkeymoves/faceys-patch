import type { ComponentPropsWithRef } from 'react'
import { Art } from '../art/Art'
import type { ArtKey, HarvestStatus } from '../domain/types'
import { cx } from './cx'
import { HandNote } from './HandNote'
import styles from './ProduceTile.module.css'

export interface ProduceTileProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  name: string
  art: ArtKey
  status: HarvestStatus
  /** "Loads of it". Shown as a handwritten "loads!". */
  glut?: boolean
  /**
   * Show "Ready now" or "Coming soon" under the name. Turn off when the grid is
   * already grouped under those headings; the status stays in the accessible name.
   */
  showStatus?: boolean
}

/** One crop on the Patch grid. It's a button: tapping opens its actions. */
export function ProduceTile({
  name,
  art,
  status,
  glut = false,
  showStatus = true,
  className,
  type = 'button',
  ...rest
}: ProduceTileProps) {
  const statusText = status === 'ready' ? 'Ready now' : 'Coming soon'
  return (
    <button
      type={type}
      className={cx(styles.tile, styles[status], className)}
      aria-label={`${name}, ${statusText.toLowerCase()}${glut ? ', loads of it' : ''}`}
      {...rest}
    >
      {glut && (
        <HandNote tone="tomato" tilt="right" className={styles.glut}>
          loads!
        </HandNote>
      )}
      <span className={styles.art}>
        <Art name={art} size={72} />
      </span>
      <span className={styles.name}>{name}</span>
      {showStatus && (
        <span className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {statusText}
        </span>
      )}
    </button>
  )
}
