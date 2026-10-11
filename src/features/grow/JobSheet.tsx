import { useState } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import type { IngredientId, JobView, MyJob } from '../../domain'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Icon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { midSentence } from '../shared/text'
import { KIND_ICONS, KIND_LABELS, whenText } from './growCopy'
import styles from './Grow.module.css'

export interface JobSheetProps {
  /** The job to show, or null when closed. */
  job: JobView | null
  /** The one crop a built-in job is about, when it names exactly one: offers its growing guide. */
  crop?: { id: IngredientId; name: string }
  onClose: () => void
  onEdit: (job: MyJob) => void
  onDeleted: (job: JobView) => void
  onPutAside: (job: JobView) => void
  onGuide: (id: IngredientId) => void
}

/** Tap a job's "About" to get this: the whole note, when it comes round, and what you can do with it. */
export function JobSheet({ job, crop, onClose, onEdit, onDeleted, onPutAside, onGuide }: JobSheetProps) {
  const { state, dispatch } = useStore()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const mine = job?.mine ? state.myJobs.find((candidate) => candidate.id === job.id) : undefined

  function deleteJob() {
    if (!job) return
    dispatch({ type: 'myJobs/remove', jobId: job.id })
    setConfirmingDelete(false)
    onDeleted(job)
  }

  return (
    <>
      <Sheet open={job !== null} onClose={onClose} title={job?.title ?? ''}>
        {job && (
          <div className={styles.job}>
            <p className={styles.jobWhen}>
              <Icon name={KIND_ICONS[job.kind]} size={22} className={styles.jobKindIcon} />
              <span>
                {KIND_LABELS[job.kind]}
                <span aria-hidden="true"> · </span>
                <span className="visually-hidden">, </span>
                {whenText(job)}
              </span>
            </p>
            {job.art && (
              <div className={styles.jobArt}>
                <Art name={job.art} size={96} />
              </div>
            )}
            {job.note ? <p className={styles.jobNote}>{job.note}</p> : null}
            <Checkbox
              label={job.on ? 'Done' : 'Done this month'}
              checked={job.done}
              onCheckedChange={() => dispatch({ type: 'jobs/toggleDone', jobId: job.id, month: job.doneKey })}
            />
            <div className={styles.jobActions}>
              {crop && (
                <Button variant="secondary" icon="seedPacket" fullWidth onClick={() => onGuide(crop.id)}>
                  How to grow {midSentence(crop.name)}
                </Button>
              )}
              {mine ? (
                <>
                  <Button variant="secondary" icon="pencil" fullWidth onClick={() => onEdit(mine)}>
                    Edit
                  </Button>
                  <Button variant="ghost" icon="bin" fullWidth onClick={() => setConfirmingDelete(true)}>
                    Delete this job
                  </Button>
                </>
              ) : (
                <Button variant="ghost" icon="minus" fullWidth onClick={() => onPutAside(job)}>
                  Not for my plot
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this job?"
        message={`"${job?.title ?? ''}" will go, along with any ticks against it. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={deleteJob}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  )
}
