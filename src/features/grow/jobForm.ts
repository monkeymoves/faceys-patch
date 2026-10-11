/*
 * The job form's model: a draft the person types into, checked against LIMITS
 * and myJobSchema before anything is dispatched (the reducer silently refuses
 * invalid changes, so the form has to catch them first).
 */
import { isISODate, LIMITS, myJobSchema, type JobKind, type MyJob } from '../../domain'

export type Repeat = 'yearly' | 'once'

export interface JobDraft {
  title: string
  note: string
  kind: JobKind
  repeat: Repeat
  /** Months, 1 to 12, for a yearly job. */
  months: number[]
  /** 'YYYY-MM-DD' from a date input, for a one-off. */
  on: string
}

export type JobDraftField = 'title' | 'note' | 'kind' | 'months' | 'on'
export type JobDraftErrors = Partial<Record<JobDraftField, string>>

export const REPEAT_OPTIONS = [
  { value: 'yearly', label: 'Every year' },
  { value: 'once', label: 'Just once' },
] as const satisfies readonly { value: Repeat; label: string }[]

/** A blank draft that comes round in `month` every year. */
export function emptyJobDraft(month: number, prefill: Partial<Pick<JobDraft, 'title' | 'kind'>> = {}): JobDraft {
  return { title: '', note: '', kind: 'tend', repeat: 'yearly', months: [month], on: '', ...prefill }
}

export function draftFromJob(job: MyJob): JobDraft {
  return {
    title: job.title,
    note: job.note,
    kind: job.kind,
    repeat: job.on ? 'once' : 'yearly',
    months: [...job.months],
    on: job.on ?? '',
  }
}

export type JobCheckResult = { ok: true; job: MyJob } | { ok: false; errors: JobDraftErrors }

/** Turns a draft into a saveable job with id `id`, or plain-words errors per field. */
export function checkJobDraft(draft: JobDraft, id: string): JobCheckResult {
  const errors: JobDraftErrors = {}
  const title = draft.title.trim()
  if (title === '') errors.title = 'Give it a title.'
  else if (title.length > LIMITS.jobTitleLength) {
    errors.title = `Keep the title to ${LIMITS.jobTitleLength} characters or fewer.`
  }
  const note = draft.note.trim()
  if (note.length > LIMITS.jobNoteLength) errors.note = `Keep the note to ${LIMITS.jobNoteLength} characters or fewer.`
  if (draft.repeat === 'yearly' && draft.months.length === 0) errors.months = 'Pick at least one month.'
  if (draft.repeat === 'once' && !isISODate(draft.on)) errors.on = 'Pick a date.'
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const job: MyJob = {
    id,
    title,
    note,
    kind: draft.kind,
    months: draft.repeat === 'yearly' ? [...draft.months].sort((a, b) => a - b) : [],
    ...(draft.repeat === 'once' ? { on: draft.on } : {}),
  }
  // Belt and braces: the schema is what the reducer checks.
  return myJobSchema.safeParse(job).success
    ? { ok: true, job }
    : { ok: false, errors: { title: "That won't save as it is. Check the title and when it comes round." } }
}
