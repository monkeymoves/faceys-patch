import { useId, type ComponentPropsWithRef } from 'react'
import { Art } from '../art/Art'
import type { ArtKey, Readiness } from '../domain/types'
import { cx } from './cx'
import { HandNote } from './HandNote'
import { Icon } from './icons'
import styles from './RecipeCard.module.css'

export interface RecipeCardVeg {
  art: ArtKey
  name: string
}

export interface RecipeCardProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'title'> {
  title: string
  minutes: number
  serves: number
  /** The patch veg it uses, drawn in a row. */
  uses: readonly RecipeCardVeg[]
  readiness: Readiness
  /** Names of what you'd need to buy, e.g. ['lemon', 'feta']. Ignored when ready. */
  missing?: readonly string[]
  /** One optional handwritten note, e.g. "uses your glut". */
  note?: string
}

/** A recipe in the Cook list. It's a button: the title is its name, the rest its description. */
export function RecipeCard({
  title,
  minutes,
  serves,
  uses,
  readiness,
  missing = [],
  note,
  className,
  type = 'button',
  ...rest
}: RecipeCardProps) {
  const titleId = useId()
  const detailsId = useId()
  const ready = readiness === 'ready' || missing.length === 0
  return (
    <button
      type={type}
      className={cx(styles.card, className)}
      aria-labelledby={titleId}
      aria-describedby={detailsId}
      {...rest}
    >
      <span className={styles.veg} aria-hidden="true">
        {uses.map((veg) => (
          <Art key={veg.art + veg.name} name={veg.art} size={40} className={styles.vegArt} />
        ))}
      </span>
      {note && (
        <HandNote tone="leaf" tilt="right" className={styles.note}>
          {note}
        </HandNote>
      )}
      <span id={titleId} className={styles.title}>
        {title}
      </span>
      <span id={detailsId} className={styles.details}>
        <span className={styles.meta}>
          <span className={styles.metaItem}>
            <Icon name="clock" size={18} />
            {minutes} min
          </span>
          <span className={styles.metaItem}>Serves {serves}</span>
          <span className="visually-hidden">. Uses {uses.map((veg) => veg.name).join(', ')}. </span>
        </span>
        <span className={cx(styles.readiness, ready ? styles.ready : styles.need)}>
          <Icon name={ready ? 'tick' : 'basket'} size={20} className={styles.readyIcon} />
          {ready ? (
            'Ready to cook'
          ) : (
            <span>
              You'll need: <span className={styles.missing}>{missing.join(', ')}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
