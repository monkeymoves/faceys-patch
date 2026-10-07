import { useId } from 'react'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { formatLongDate, type ISODate, type RecipeId } from '../../domain'
import { HandNote } from '../../ui/HandNote'
import { Sheet } from '../../ui/Sheet'
import { upcomingDays, type DayChoice } from './recipeParts'
import styles from './DayPicker.module.css'

export interface DayPickerSheetProps {
  open: boolean
  /** The recipe being added, so days that already have it can say so. */
  recipeId?: RecipeId
  recipeTitle: string
  onClose: () => void
  onPick: (date: ISODate) => void
}

/** "Add to a day": today and the next 13 days, each showing what's already planned. */
export function DayPickerSheet({ open, recipeId, recipeTitle, onClose, onPick }: DayPickerSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Which day?">
      <DayChoices recipeId={recipeId} recipeTitle={recipeTitle} onPick={onPick} />
    </Sheet>
  )
}

function DayChoices({ recipeId, recipeTitle, onPick }: Pick<DayPickerSheetProps, 'recipeId' | 'recipeTitle' | 'onPick'>) {
  const { state, catalogue } = useStore()
  const today = useToday()
  const groups = upcomingDays(today, state.plan, catalogue, recipeId)
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
  const alreadyId = useId()
  const label = formatLongDate(day.date)
  return (
    <button
      type="button"
      className={styles.day}
      aria-label={day.today ? `${label}, today` : label}
      aria-describedby={day.alreadyPlanned ? `${alreadyId} ${plannedId}` : plannedId}
      onClick={() => onPick(day.date)}
    >
      <span className={styles.dayTop}>
        <span className={styles.date}>{label}</span>
        {day.today && (
          <HandNote tone="leaf" tilt="right" className={styles.today}>
            today
          </HandNote>
        )}
        {/* Still allowed (some cook a favourite twice), but never by accident. */}
        {day.alreadyPlanned && (
          <span id={alreadyId} className={styles.already}>
            Already planned
          </span>
        )}
      </span>
      <span id={plannedId} className={day.planned.length > 0 ? styles.planned : styles.free}>
        {day.planned.length > 0 ? day.planned.join(', ') : 'Nothing planned yet'}
      </span>
    </button>
  )
}
