import { monthKey, monthKeyOf, type MonthRef } from './dates'
import {
  JOB_KINDS,
  type Almanac,
  type AppState,
  type ArtKey,
  type Catalogue,
  type CropGuide,
  type Ingredient,
  type ISODate,
  type ISOMonth,
  type Job,
  type JobKind,
  type MyJob,
} from './types'

export function buildAlmanac(guides: readonly CropGuide[], jobs: readonly Job[]): Almanac {
  return { guides: new Map(guides.map((guide) => [guide.ingredientId, guide])), jobs }
}

const byName = (a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name, 'en-GB')

/** Everything that can be grown, A to Z. */
export function growableCrops(catalogue: Catalogue): Ingredient[] {
  return [...catalogue.ingredients.values()].filter((ingredient) => ingredient.growable).sort(byName)
}

// ---------------------------------------------------------------------------
// Sowing and planting
// ---------------------------------------------------------------------------

/** The four things that happen to a crop over a year, in the order they're drawn. */
export const CROP_ACTIVITIES = ['sowIndoors', 'sowOutdoors', 'plantOut', 'harvest'] as const

export type CropActivity = (typeof CROP_ACTIVITIES)[number]

/** A crop's year: the months each activity happens in. Empty lists for anything that doesn't apply. */
export type CropYear = Readonly<Record<CropActivity, readonly number[]>>

/**
 * When to sow, plant and pick a crop. Without a guide (the person's own
 * crops, for one) only the harvest months are known.
 */
export function cropYear(ingredient: Ingredient, almanac: Almanac): CropYear {
  const guide = almanac.guides.get(ingredient.id)
  return {
    sowIndoors: guide?.sowIndoors ?? [],
    sowOutdoors: guide?.sowOutdoors ?? [],
    plantOut: guide?.plantOut ?? [],
    harvest: ingredient.harvestMonths ?? [],
  }
}

/** True if anything at all happens in some month. */
export const hasActivity = (year: CropYear) => CROP_ACTIVITIES.some((activity) => year[activity].length > 0)

export interface CropCalendarEntry {
  ingredient: Ingredient
  year: CropYear
}

/** Every growable crop with its year, A to Z, skipping any with nothing to show. */
export function cropCalendar(almanac: Almanac, catalogue: Catalogue): CropCalendarEntry[] {
  return growableCrops(catalogue)
    .map((ingredient) => ({ ingredient, year: cropYear(ingredient, almanac) }))
    .filter((entry) => hasActivity(entry.year))
}

/** What to sow and plant in a month, A to Z within each list. Only crops the catalogue knows. */
export type MonthSowing = Readonly<Record<Exclude<CropActivity, 'harvest'>, Ingredient[]>>

export function sowingForMonth(month: number, almanac: Almanac, catalogue: Catalogue): MonthSowing {
  const sowing: Record<Exclude<CropActivity, 'harvest'>, Ingredient[]> = {
    sowIndoors: [],
    sowOutdoors: [],
    plantOut: [],
  }
  for (const guide of almanac.guides.values()) {
    const ingredient = catalogue.ingredients.get(guide.ingredientId)
    if (!ingredient) continue
    if (guide.sowIndoors?.includes(month)) sowing.sowIndoors.push(ingredient)
    if (guide.sowOutdoors?.includes(month)) sowing.sowOutdoors.push(ingredient)
    if (guide.plantOut?.includes(month)) sowing.plantOut.push(ingredient)
  }
  sowing.sowIndoors.sort(byName)
  sowing.sowOutdoors.sort(byName)
  sowing.plantOut.sort(byName)
  return sowing
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

/** A job as shown for one month, built-in or the person's own. */
export interface JobView {
  id: string
  title: string
  note: string
  kind: JobKind
  /** The person's own, so it can be edited and deleted. Built-in ones can be put aside instead. */
  mine: boolean
  /** Months it comes round every year. Empty for a one-off. */
  months: readonly number[]
  /** A one-off job's date. */
  on?: ISODate
  /** A one-off whose date has passed and isn't ticked. */
  overdue: boolean
  /** A one-off from an earlier month, shown again in the current month as still to do. */
  broughtForward: boolean
  done: boolean
  /** The month its tick is stored under: the month on show, or a one-off's own month. */
  doneKey: ISOMonth
  /** A drawing of a crop the job is about, if there is one. */
  art?: ArtKey
}

export interface JobsInput {
  almanac: Almanac
  catalogue: Catalogue
  state: Pick<AppState, 'myJobs' | 'jobsDone' | 'hiddenJobs'>
  /** The month on show. */
  month: MonthRef
  today: ISODate
  /**
   * Ids of brought-forward one-offs to keep listing even once ticked (the ones
   * ticked on this visit), so a row doesn't vanish from under the person's thumb.
   */
  keep?: ReadonlySet<string>
}

const KIND_ORDER = new Map(JOB_KINDS.map((kind, index) => [kind, index]))

const firstArt = (job: Job, catalogue: Catalogue): ArtKey | undefined =>
  job.crops?.map((id) => catalogue.ingredients.get(id)?.art).find((art) => art !== undefined)

const isDone = (state: JobsInput['state'], key: ISOMonth, id: string) => state.jobsDone[key]?.includes(id) ?? false

function builtInView(job: Job, input: JobsInput): JobView {
  const doneKey = monthKey(input.month)
  return {
    id: job.id,
    title: job.title,
    note: job.note,
    kind: job.kind,
    mine: false,
    months: job.months,
    overdue: false,
    broughtForward: false,
    done: isDone(input.state, doneKey, job.id),
    doneKey,
    art: firstArt(job, input.catalogue),
  }
}

function myView(job: MyJob, input: JobsInput): JobView {
  const doneKey = job.on ? monthKeyOf(job.on) : monthKey(input.month)
  const done = isDone(input.state, doneKey, job.id)
  return {
    id: job.id,
    title: job.title,
    note: job.note,
    kind: job.kind,
    mine: true,
    months: job.months,
    on: job.on,
    overdue: job.on !== undefined && job.on < input.today && !done,
    broughtForward: false,
    done,
    doneKey,
  }
}

/** Within one kind: own one-offs by date, then own yearly jobs A to Z, then built-in jobs in their own order. */
function compareJobs(a: JobView, b: JobView): number {
  const kind = (KIND_ORDER.get(a.kind) ?? 0) - (KIND_ORDER.get(b.kind) ?? 0)
  if (kind !== 0) return kind
  if (a.mine !== b.mine) return a.mine ? -1 : 1
  if (!a.mine) return 0
  if (a.on && b.on) return a.on.localeCompare(b.on)
  if (a.on || b.on) return a.on ? -1 : 1
  return a.title.localeCompare(b.title, 'en-GB')
}

/**
 * The jobs for a month: the built-in ones due then (bar any put aside), the
 * person's own yearly jobs due then, and their one-offs dated in that month.
 * In the current month, undone one-offs from earlier months come back as
 * overdue, first in the list. The rest are in JOB_KINDS order, then as
 * described in compareJobs. Deterministic.
 */
export function jobsForMonth(input: JobsInput): JobView[] {
  const { almanac, state, month, today, keep } = input
  const key = monthKey(month)
  const hidden = new Set(state.hiddenJobs)
  const thisMonth = key === monthKeyOf(today)

  const builtIn = almanac.jobs
    .filter((job) => !hidden.has(job.id) && job.months.includes(month.month))
    .map((job) => builtInView(job, input))

  const mine = state.myJobs
    .filter((job) => (job.on ? monthKeyOf(job.on) === key : job.months.includes(month.month)))
    .map((job) => myView(job, input))

  const broughtForward = thisMonth
    ? state.myJobs
        .filter((job) => job.on !== undefined && monthKeyOf(job.on) < key)
        .map((job) => ({ ...myView(job, input), broughtForward: true }))
        .filter((job) => job.overdue || keep?.has(job.id))
        .sort((a, b) => (a.on ?? '').localeCompare(b.on ?? ''))
    : []

  // A stable sort, so built-in jobs keep the order the data gives them.
  return [...broughtForward, ...[...mine, ...builtIn].sort(compareJobs)]
}

export interface JobGroup {
  kind: JobKind
  jobs: JobView[]
}

/** Jobs by kind, in JOB_KINDS order, leaving out kinds with nothing in them and anything brought forward. */
export function groupJobsByKind(jobs: readonly JobView[]): JobGroup[] {
  return JOB_KINDS.map((kind) => ({
    kind,
    jobs: jobs.filter((job) => job.kind === kind && !job.broughtForward),
  })).filter((group) => group.jobs.length > 0)
}

/** Built-in jobs the person has put aside, in the almanac's order. */
export function hiddenJobs(almanac: Almanac, state: Pick<AppState, 'hiddenJobs'>): Job[] {
  const hidden = new Set(state.hiddenJobs)
  return almanac.jobs.filter((job) => hidden.has(job.id))
}

/** How many jobs are still to do in the month (overdue ones included). */
export function jobsToDo(input: JobsInput): number {
  return jobsForMonth(input).filter((job) => !job.done).length
}
