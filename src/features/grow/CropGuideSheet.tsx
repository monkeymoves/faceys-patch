import { useId } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { cropYear, type CropActivity, type IngredientId, type JobKind } from '../../domain'
import { Button } from '../../ui/Button'
import { MonthStrip } from '../../ui/MonthStrip'
import { Sheet } from '../../ui/Sheet'
import { stripRows } from '../shared/growing'
import { capitalise, midSentence } from '../shared/text'
import { jobAbout } from './growCopy'
import styles from './Grow.module.css'

export interface GuideTarget {
  id: IngredientId
  /** How it was reached, so "Add a job" can suggest a title. */
  activity?: CropActivity
}

export interface CropGuideSheetProps {
  target: GuideTarget | null
  /** The month to mark on the calendar, 1 to 12. */
  month: number
  onClose: () => void
  onAddJob: (prefill: { title: string; kind: JobKind }) => void
}

/** How and when to grow a crop: its year as a chart and in words, then the tips. */
export function CropGuideSheet({ target, month, onClose, onAddJob }: CropGuideSheetProps) {
  const { catalogue, almanac } = useStore()
  const tipsId = useId()
  const ingredient = target ? catalogue.ingredients.get(target.id) : undefined
  const guide = ingredient ? almanac.guides.get(ingredient.id) : undefined
  const rows = ingredient ? stripRows(cropYear(ingredient, almanac)) : []
  const active = rows.filter((row) => row.months.length > 0)
  // 'Sow under cover February to April, plant May and June, harvest July to September.'
  const inWords = `${capitalise(active.map((row) => `${row.label.toLowerCase()} ${row.spoken}`).join(', '))}.`

  return (
    <Sheet open={ingredient !== undefined} onClose={onClose} title={ingredient?.name ?? ''}>
      {ingredient && target && (
        <div className={styles.guide}>
          <div className={styles.guideArt}>
            <Art name={ingredient.art ?? 'seedling'} size={112} />
          </div>
          {active.length > 0 ? (
            <div className={styles.guideYear}>
              <MonthStrip rows={rows} currentMonth={month} decorative />
              <p className={styles.guideWhen}>{inWords}</p>
            </div>
          ) : (
            <p className={styles.guideNote}>No calendar for this one yet.</p>
          )}
          {guide && guide.tips.length > 0 ? (
            <section aria-labelledby={tipsId} className={styles.tips}>
              <h3 id={tipsId} className={styles.tipsHeading}>
                How to grow it
              </h3>
              <ul className={styles.tipsList}>
                {guide.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          ) : (
            <p className={styles.guideNote}>
              No growing notes for {midSentence(ingredient.name)} yet. Add a job to remind yourself what to do and
              when.
            </p>
          )}
          <div className={styles.guideActions}>
            <Button
              variant="secondary"
              icon="plus"
              fullWidth
              onClick={() => onAddJob(jobAbout(ingredient.name, target.activity))}
            >
              Add a job about {midSentence(ingredient.name)}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
