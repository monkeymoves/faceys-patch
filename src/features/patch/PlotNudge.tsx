import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { jobsToDo, monthRefOf } from '../../domain'
import { Button } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Icon } from '../../ui/icons'
import { plural } from '../shared/text'
import styles from './Patch.module.css'

/** A quiet reminder on the Patch: how many jobs are waiting on the plot this month. Nothing when there are none. */
export function PlotNudge({ className }: { className?: string }) {
  const { state, catalogue, almanac } = useStore()
  const { go } = useNavigation()
  const today = useToday()
  const count = jobsToDo({ almanac, catalogue, state, month: monthRefOf(today), today })
  if (count === 0) return null
  return (
    <div className={cx(styles.nudge, className)}>
      <Icon name="wateringCan" size={28} className={styles.nudgeIcon} />
      <p className={styles.nudgeText}>{plural(count, 'job', 'jobs')} to do on the plot this month</p>
      <Button size="sm" variant="secondary" onClick={() => go({ tab: 'grow' })}>
        See the jobs
      </Button>
    </div>
  )
}
