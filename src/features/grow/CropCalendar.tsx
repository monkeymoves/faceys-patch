import { useDeferredValue, useMemo, useState } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { CROP_ACTIVITIES, cropCalendar, type IngredientId } from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { cx } from '../../ui/cx'
import { MonthStrip } from '../../ui/MonthStrip'
import { SearchField } from '../../ui/SearchField'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { ACTIVITY_LABELS, stripRows } from '../shared/growing'
import { matchesQuery, plural } from '../shared/text'
import { useResultsAnnouncement } from '../shared/useResultsAnnouncement'
import styles from './Grow.module.css'

const NOTHING_FOUND = 'No crop matches that.'

export interface CropCalendarProps {
  /** This month, 1 to 12, marked on every strip. */
  month: number
  onOpen: (id: IngredientId) => void
}

/** Every crop with its year as a strip, A to Z, like the chart on the back of a seed packet. */
export function CropCalendar({ month, onOpen }: CropCalendarProps) {
  const { catalogue, almanac } = useStore()
  const [query, setQuery] = useState('')
  const [announcement, announce] = useAnnouncer()
  // Seventy strips of sixty cells: build the rows once, and let typing stay ahead of the list.
  const entries = useMemo(
    () => cropCalendar(almanac, catalogue).map((entry) => ({ ...entry, rows: stripRows(entry.year) })),
    [almanac, catalogue],
  )
  const deferredQuery = useDeferredValue(query)
  const found = entries.filter((entry) => matchesQuery(entry.ingredient.name, deferredQuery))

  useResultsAnnouncement(
    announce,
    query,
    found.length === 0 ? NOTHING_FOUND : `${plural(found.length, 'crop', 'crops')} found.`,
  )

  return (
    <div className={styles.calendar}>
      <Announcer message={announcement} />
      <SearchField
        label="Find a crop"
        hideLabel
        placeholder="Tomatoes, garlic, kale..."
        value={query}
        onChange={setQuery}
      />
      <ul role="list" className={styles.legend} aria-label="Key">
        {CROP_ACTIVITIES.map((activity) => (
          <li key={activity} className={styles.legendItem}>
            <span className={cx(styles.swatch, styles[activity])} aria-hidden="true" />
            {ACTIVITY_LABELS[activity]}
          </li>
        ))}
      </ul>
      {found.length === 0 ? (
        <p className={styles.nothingFound}>{NOTHING_FOUND}</p>
      ) : (
        <ul role="list" className={styles.cropList}>
          {found.map(({ ingredient, rows }) => (
            <li key={ingredient.id} className={styles.cropRow}>
              <button type="button" className={styles.cropOpen} onClick={() => onOpen(ingredient.id)}>
                <Art name={ingredient.art ?? 'seedling'} size={36} />
                <span className={styles.cropName}>{ingredient.name}</span>
              </button>
              <MonthStrip compact rows={rows} currentMonth={month} className={styles.cropStrip} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
