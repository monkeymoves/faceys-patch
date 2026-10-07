import { useId } from 'react'
import { cx } from './cx'
import { Icon } from './icons'
import { IconButton } from './IconButton'
import { DateRingMark } from './marks'
import styles from './DayCard.module.css'

export interface DayMeal {
  id: string
  title: string
  cooked: boolean
}

export interface DayCardProps {
  /** e.g. 'Monday'. Written in the handwritten face. */
  dayName: string
  /** Day of the month, e.g. 14. */
  dayNumber: number
  /** Full name for screen readers, e.g. 'Monday 14 October'. */
  label: string
  today?: boolean
  /** Dims the card a little. */
  past?: boolean
  meals: readonly DayMeal[]
  onSelectMeal: (mealId: string) => void
  onAddMeal: () => void
  emptyText?: string
  className?: string
}

/** One day in the Week view: day and date in the margin, meals on the right. */
export function DayCard({
  dayName,
  dayNumber,
  label,
  today = false,
  past = false,
  meals,
  onSelectMeal,
  onAddMeal,
  emptyText = 'Nothing planned yet',
  className,
}: DayCardProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      aria-current={today ? 'date' : undefined}
      className={cx(styles.day, today && styles.today, past && styles.past, className)}
    >
      <h3 id={headingId} className={styles.date}>
        <span className="visually-hidden">
          {label}
          {today ? ', today' : ''}
        </span>
        <span aria-hidden="true" className={styles.dayName}>
          {dayName}
        </span>
        <span aria-hidden="true" className={styles.number}>
          {today && <DateRingMark className={styles.ring} />}
          {dayNumber}
        </span>
      </h3>
      <div className={styles.meals}>
        {meals.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          <ul role="list" className={styles.list}>
            {meals.map((meal) => (
              <li key={meal.id}>
                <button
                  type="button"
                  className={cx(styles.meal, meal.cooked && styles.cooked)}
                  onClick={() => onSelectMeal(meal.id)}
                >
                  <span className={styles.mealTitle}>{meal.title}</span>
                  {meal.cooked && (
                    <span className={styles.cookedMark}>
                      <Icon name="tick" size={18} />
                      Cooked
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <IconButton icon="plus" label={`Add a meal to ${label}`} onClick={onAddMeal} className={styles.add} />
    </section>
  )
}
