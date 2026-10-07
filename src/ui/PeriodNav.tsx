import { useRef } from 'react'
import { Button } from './Button'
import { cx } from './cx'
import { IconButton } from './IconButton'
import styles from './PeriodNav.module.css'

export interface PeriodNavProps {
  /** What's on show, in plain words, e.g. 'This week, 5 to 11 October'. */
  label: string
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  /**
   * A way back to now, e.g. 'Back to this week', shown under the label. It goes
   * away once used, so focus moves to the previous button.
   */
  jump?: { label: string; onClick: () => void }
  className?: string
}

/** Previous and next buttons round the week or month on show. */
export function PeriodNav({ label, previousLabel, nextLabel, onPrevious, onNext, jump, className }: PeriodNavProps) {
  const previous = useRef<HTMLButtonElement>(null)
  return (
    <div className={cx(styles.nav, className)}>
      <div className={styles.bar}>
        <IconButton ref={previous} icon="chevronLeft" label={previousLabel} variant="secondary" onClick={onPrevious} />
        <p className={styles.label}>{label}</p>
        <IconButton icon="chevronRight" label={nextLabel} variant="secondary" onClick={onNext} />
      </div>
      {jump && (
        <Button
          variant="ghost"
          size="sm"
          className={styles.jump}
          onClick={() => {
            jump.onClick()
            previous.current?.focus()
          }}
        >
          {jump.label}
        </Button>
      )}
    </div>
  )
}
