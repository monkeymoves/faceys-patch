/*
 * Words for the Grow screen: what each kind of job is called and drawn as,
 * when a job comes round, and the little summaries. Pure, no React.
 */
import {
  formatLongDate,
  formatMonths,
  JOB_KINDS,
  monthName,
  type CropActivity,
  type JobKind,
  type JobView,
  type MyJob,
} from '../../domain'
import type { IconName } from '../../ui/icons'
import { midSentence } from '../shared/text'

export const KIND_LABELS: Record<JobKind, string> = {
  sow: 'Sow',
  plant: 'Plant',
  tend: 'Tend',
  protect: 'Protect',
  harvest: 'Harvest and store',
  prepare: 'Prepare',
}

export const KIND_ICONS: Record<JobKind, IconName> = {
  sow: 'seedPacket',
  plant: 'trowel',
  tend: 'wateringCan',
  protect: 'cloche',
  harvest: 'basket',
  prepare: 'fork',
}

/** Every kind, for a Select. */
export const KIND_OPTIONS: readonly { value: JobKind; label: string }[] = JOB_KINDS.map((kind) => ({
  value: kind,
  label: KIND_LABELS[kind],
}))

/** The twelve months, for a row of chips. */
export const MONTH_OPTIONS: readonly { value: number; label: string; short: string }[] = Array.from(
  { length: 12 },
  (_, index) => ({ value: index + 1, label: monthName(index + 1), short: monthName(index + 1).slice(0, 3) }),
)

/** 'Every October and November', 'Every month', or for a one-off 'Tuesday 14 October' ('Was due' once it has passed). */
export function whenText(job: Pick<MyJob, 'months' | 'on'> & { overdue?: boolean }): string {
  if (job.on) return job.overdue ? `Was due ${formatLongDate(job.on)}` : formatLongDate(job.on)
  const months = formatMonths(job.months)
  return months === 'All year' ? 'Every month' : `Every ${months}`
}

/** The first sentence of a note, for a one-line hint. */
export function firstSentence(note: string): string {
  const trimmed = note.trim()
  // No lookbehind: Safari before 16.4 can't parse one, and it would take the whole bundle down.
  return /^.*?[.!?](?=\s|$)/s.exec(trimmed)?.[0] ?? trimmed
}

/** The quiet line under a job's title: its date for a one-off, otherwise the start of its note. */
export function jobHint(job: JobView): string | undefined {
  if (job.on) return whenText(job)
  return job.note ? firstSentence(job.note) : undefined
}

/** '4 of 12 still to do', 'All 12 done', or 'Nothing on the list this month'. */
export function jobsLeftText(toDo: number, total: number): string {
  if (total === 0) return 'Nothing on the list this month'
  if (toDo === 0) return total === 1 ? 'Done' : `All ${total} done`
  return `${toDo} of ${total} still to do`
}

/** A starting title and kind for a job about a crop, from the activity it was reached through. */
export function jobAbout(name: string, activity: CropActivity | undefined): { title: string; kind: JobKind } {
  const crop = midSentence(name)
  switch (activity) {
    case 'sowIndoors':
      return { title: `Sow ${crop} under cover`, kind: 'sow' }
    case 'sowOutdoors':
      return { title: `Sow ${crop} outside`, kind: 'sow' }
    case 'plantOut':
      return { title: `Plant ${crop}`, kind: 'plant' }
    case 'harvest':
      return { title: `Pick ${crop}`, kind: 'harvest' }
    default:
      return { title: '', kind: 'tend' }
  }
}

/** 'Put "Mulch empty beds" aside.' */
export const putAsideText = (title: string) => `Put "${title}" aside. It won't come round again unless you bring it back.`
