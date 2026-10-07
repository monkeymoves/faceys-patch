import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { isSameMonth, monthGrid, parseISODate, type ISODate } from '../../domain'
import { cx } from '../../ui/cx'
import { DateRingMark } from '../../ui/marks'
import { dayArt, firstOfMonth, knownMeals, monthDayLabel, type MonthRef } from './weekPlan'
import styles from './MonthView.module.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface MonthViewProps {
  month: MonthRef
  today: ISODate
  /** Tapping a day: show its week. */
  onPickDay: (date: ISODate) => void
}

/** A Monday-first month, with a little drawing on each planned day. */
export function MonthView({ month, today, onPickDay }: MonthViewProps) {
  const { state, catalogue } = useStore()
  const first = firstOfMonth(month)
  const dates = monthGrid(month.year, month.month).flat()

  return (
    <div className={styles.month}>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <ul role="list" className={styles.grid}>
        {dates.map((date) => {
          const meals = knownMeals(state.plan, date, catalogue)
          const art = dayArt(meals, catalogue, state.harvest)
          const isToday = date === today
          return (
            <li key={date}>
              <button
                type="button"
                className={cx(
                  styles.day,
                  !isSameMonth(date, first) && styles.outside,
                  date < today && styles.past,
                  isToday && styles.today,
                )}
                aria-label={monthDayLabel(date, today, meals.length)}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => onPickDay(date)}
              >
                <span className={styles.number}>
                  {isToday && <DateRingMark className={styles.ring} />}
                  {parseISODate(date).getDate()}
                </span>
                <span className={styles.mark} aria-hidden="true">
                  {art ? <Art name={art} size={26} /> : meals.length > 0 && <span className={styles.dot} />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
