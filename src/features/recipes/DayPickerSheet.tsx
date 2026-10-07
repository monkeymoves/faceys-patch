import { useId } from 'react'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { formatLongDate, type ISODate } from '../../domain'
import { HandNote } from '../../ui/HandNote'
import { Sheet } from '../../ui/Sheet'
import { upcomingDays, type DayChoice } from './recipeParts'
import styles from './DayPicker.module.css'

export interface DayPickerSheetProps {
  open: boolean
  recipeTitle: string
  onClose: () => void
  onPick: (date: ISODate) => void
}

/** "Add to week": today and the next 13 days, each showing what's already planned. */
export function DayPickerSheet({ open, recipeTitle, onClose, onPick }: DayPickerSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Which day?">
      <DayChoices recipeTitle={recipeTitle} onPick={onPick} />
    </Sheet>
  )
}

function DayChoices({ recipeTitle, onPick }: Pick<DayPickerSheetProps, 'recipeTitle' | 'onPick'>) {
  const { state, catalogue } = useStore()
  const today = useToday()
  const groups = upcomingDays(today, state.plan, catalogue)
  const baseId = useId()

  return (
    <div className={styles.picker}>
      <p className={styles.lede}>Pick a day for {recipeTitle}.</p>
      {groups.map((group, index) => (
        <section key={group.label} aria-labelledby={`${baseId}-${index}`} className={styles.group}>
          <h3 id={`${baseId}-${index}`} className={styles.heading}>
            {group.label}
          </h3>
          <ul role="list" className={styles.days}>
            {group.days.map((day) => (
              <li key={day.date}>
                <DayButton day={day} onPick={onPick} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function DayButton({ day, onPick }: { day: DayChoice; onPick: (date: ISODate) => void }) {
  const plannedId = useId()
  const label = formatLongDate(day.date)
  return (
    <button
      type="button"
      className={styles.day}
      aria-label={day.today ? `${label}, today` : label}
      aria-describedby={plannedId}
      onClick={() => onPick(day.date)}
    >
      <span className={styles.dayTop}>
        <span className={styles.date}>{label}</span>
        {day.today && (
          <HandNote tone="leaf" tilt="right" className={styles.today}>
            today
          </HandNote>
        )}
      </span>
      <span id={plannedId} className={day.planned.length > 0 ? styles.planned : styles.free}>
        {day.planned.length > 0 ? day.planned.join(', ') : 'Nothing planned yet'}
      </span>
    </button>
  )
}
