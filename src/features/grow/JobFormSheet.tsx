import { useEffect, useId, useRef, useState } from 'react'
import { useStore } from '../../app/useStore'
import { LIMITS, makeMyId, type MyJob } from '../../domain'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Select } from '../../ui/Select'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Sheet } from '../../ui/Sheet'
import { TextArea } from '../../ui/TextArea'
import { TextField } from '../../ui/TextField'
import { ToggleChip } from '../../ui/ToggleChip'
import { KIND_OPTIONS, MONTH_OPTIONS } from './growCopy'
import {
  checkJobDraft,
  draftFromJob,
  emptyJobDraft,
  REPEAT_OPTIONS,
  type JobDraft,
  type JobDraftErrors,
  type JobDraftField,
} from './jobForm'
import styles from './Grow.module.css'

export type JobFormRequest =
  | { mode: 'new'; month: number; prefill?: Partial<Pick<JobDraft, 'title' | 'kind'>> }
  | { mode: 'edit'; job: MyJob }

export interface JobFormSheetProps {
  /** What to open, or null when closed. */
  request: JobFormRequest | null
  onClose: () => void
  onSaved: (job: MyJob, mode: 'new' | 'edit') => void
}

/** Add or edit a job of your own. Nothing is saved until it passes every check. */
export function JobFormSheet({ request, onClose, onSaved }: JobFormSheetProps) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const dirty = useRef(false)

  function close() {
    setConfirmingDiscard(false)
    dirty.current = false
    onClose()
  }

  return (
    <>
      <Sheet
        open={request !== null}
        onClose={close}
        shouldClose={() => {
          if (!dirty.current) return true
          setConfirmingDiscard(true)
          return false
        }}
        title={request?.mode === 'edit' ? 'Edit job' : 'Add a job'}
        tall
      >
        {request && (
          <JobForm
            request={request}
            onDirty={(value) => {
              dirty.current = value
            }}
            onCancel={() => {
              if (dirty.current) setConfirmingDiscard(true)
              else close()
            }}
            onSaved={(job) => {
              dirty.current = false
              onSaved(job, request.mode)
            }}
          />
        )}
      </Sheet>
      <ConfirmDialog
        open={confirmingDiscard}
        title="Throw away these changes?"
        message="What you've typed won't be kept."
        confirmLabel="Throw away"
        destructive
        onConfirm={close}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </>
  )
}

interface JobFormProps {
  request: JobFormRequest
  onDirty: (dirty: boolean) => void
  onCancel: () => void
  onSaved: (job: MyJob) => void
}

const startingDraft = (request: JobFormRequest): JobDraft =>
  request.mode === 'edit' ? draftFromJob(request.job) : emptyJobDraft(request.month, request.prefill)

const sameDraft = (a: JobDraft, b: JobDraft) => JSON.stringify(a) === JSON.stringify(b)

function JobForm({ request, onDirty, onCancel, onSaved }: JobFormProps) {
  const { state, dispatch } = useStore()
  const [start] = useState(() => startingDraft(request))
  const [draft, setDraft] = useState(start)
  const [errors, setErrors] = useState<JobDraftErrors>({})
  const [attempts, setAttempts] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const monthsErrorId = useId()

  useEffect(() => {
    onDirty(!sameDraft(draft, start))
  }, [draft, start, onDirty])

  // After a failed save, take the person to the first thing to fix.
  useEffect(() => {
    if (attempts === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]')?.focus()
  }, [attempts])

  function change<K extends keyof JobDraft>(key: K, value: JobDraft[K], field?: JobDraftField) {
    setDraft((current) => ({ ...current, [key]: value }))
    if (field && errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function toggleMonth(month: number, on: boolean) {
    const months = on ? [...draft.months, month] : draft.months.filter((other) => other !== month)
    change('months', months, 'months')
  }

  function save() {
    const editing = request.mode === 'edit'
    if (!editing && state.myJobs.length >= LIMITS.myJobs) {
      setErrors({ title: "You've added as many jobs as the app can keep." })
      setAttempts((count) => count + 1)
      return
    }
    const id = editing ? request.job.id : makeMyId(draft.title.trim() || 'job')
    const result = checkJobDraft(draft, id)
    if (!result.ok) {
      setErrors(result.errors)
      setAttempts((count) => count + 1)
      return
    }
    dispatch({ type: 'myJobs/save', job: result.job })
    onSaved(result.job)
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <TextField
        label="Title"
        value={draft.title}
        onChange={(value) => change('title', value, 'title')}
        error={errors.title}
        maxLength={LIMITS.jobTitleLength}
        placeholder="e.g. Net the strawberries"
        autoComplete="off"
        data-autofocus=""
      />
      <Select
        label="What sort of job"
        options={KIND_OPTIONS}
        value={draft.kind}
        onChange={(value) => change('kind', value, 'kind')}
      />
      <div className={styles.when}>
        <SegmentedControl
          label="When"
          options={REPEAT_OPTIONS}
          value={draft.repeat}
          onChange={(value) => change('repeat', value)}
          className={styles.fullSegments}
        />
        {draft.repeat === 'yearly' ? (
          <fieldset className={styles.months} aria-describedby={errors.months ? monthsErrorId : undefined}>
            <legend className={styles.monthsLabel}>Which months</legend>
            <ul role="list" className={styles.monthChips}>
              {MONTH_OPTIONS.map((month, index) => (
                <li key={month.value}>
                  <ToggleChip
                    pressed={draft.months.includes(month.value)}
                    onPressedChange={(on) => toggleMonth(month.value, on)}
                    aria-label={month.label}
                    aria-describedby={errors.months ? monthsErrorId : undefined}
                    data-invalid={errors.months && index === 0 ? '' : undefined}
                    className={styles.monthChip}
                  >
                    {month.short}
                  </ToggleChip>
                </li>
              ))}
            </ul>
            {errors.months && (
              <p id={monthsErrorId} className={styles.fieldError}>
                {errors.months}
              </p>
            )}
          </fieldset>
        ) : (
          <TextField
            label="Date"
            type="date"
            value={draft.on}
            onChange={(value) => change('on', value, 'on')}
            error={errors.on}
            className={styles.dateField}
          />
        )}
      </div>
      <TextArea
        label="Note"
        optional
        hint="Anything future you will thank you for: where, how, which variety."
        value={draft.note}
        onChange={(value) => change('note', value, 'note')}
        error={errors.note}
        maxLength={LIMITS.jobNoteLength}
        rows={3}
      />
      <div className={styles.footer}>
        <Button type="submit">Save job</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
