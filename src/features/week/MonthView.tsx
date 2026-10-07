import { useRef, useState, type KeyboardEvent } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { isSameMonth, knownMeals, monthGrid, parseISODate, type ISODate } from '../../domain'
import { cx } from '../../ui/cx'
import { DateRingMark } from '../../ui/marks'
import { dayArt, firstOfMonth, monthDayLabel, type MonthRef } from './weekPlan'
import styles from './MonthView.module.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** How far each key moves through the grid, in days. Home and End go to the ends of the row. */
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

export interface MonthViewProps {
  month: MonthRef
  today: ISODate
  /** Tapping a day: show its week. */
  onPickDay: (date: ISODate) => void
}

/**
 * A Monday-first month, with a little drawing on each planned day. One tab
 * stop: the arrow keys move between days (Up and Down by a week), and Home
 * and End go to the start and end of the week.
 */
export function MonthView({ month, today, onPickDay }: MonthViewProps) {
  const { state, catalogue } = useStore()
  const first = firstOfMonth(month)
  const dates = monthGrid(month.year, month.month).flat()
  const [chosen, setChosen] = useState<ISODate | null>(null)
  const buttons = useRef(new Map<ISODate, HTMLButtonElement>())
  // The day that takes the tab stop: the last one moved to, else today, else the 1st.
  const current = chosen && dates.includes(chosen) ? chosen : dates.includes(today) ? today : first

  function onKeyDown(event: KeyboardEvent, date: ISODate) {
    const index = dates.indexOf(date)
    const rowStart = index - (index % 7)
    let target: number
    if (event.key in STEPS) target = index + (STEPS[event.key] ?? 0)
    else if (event.key === 'Home') target = rowStart
    else if (event.key === 'End') target = rowStart + 6
    else return
    event.preventDefault()
    // Past the edge of the grid, stay put.
    const next = dates[target]
    if (!next) return
    setChosen(next)
    buttons.current.get(next)?.focus()
  }

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
                ref={(node) => {
                  if (node) buttons.current.set(date, node)
                  else buttons.current.delete(date)
                }}
                type="button"
                tabIndex={date === current ? 0 : -1}
                className={cx(
                  styles.day,
                  !isSameMonth(date, first) && styles.outside,
                  date < today && styles.past,
                  isToday && styles.today,
                )}
                aria-label={monthDayLabel(date, today, meals.length)}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => onPickDay(date)}
                onKeyDown={(event) => onKeyDown(event, date)}
                onFocus={() => setChosen(date)}
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
