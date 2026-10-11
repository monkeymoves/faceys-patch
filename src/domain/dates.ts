import type { ISODate, ISOMonth } from './types'

const pad = (value: number, width: number) => String(value).padStart(width, '0')

/** The local calendar date of `date`. Never uses toISOString, which is UTC and slips a day in BST. */
export function toISODate(date: Date): ISODate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`
}

function assertMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Month must be 1 to 12, not ${month}`)
  }
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Local midnight on the given day. Out-of-range days roll over: day 0 is the last day of the month before. */
function localDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month - 1, day)
  // new Date() maps years 0 to 99 onto the 1900s; setFullYear does not.
  date.setFullYear(year, month - 1, day)
  return date
}

/** True only for a real calendar date written 'YYYY-MM-DD' (so '2026-02-30' is false). */
export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number) as [number, number, number, number]
  return toISODate(localDate(year, month, day)) === value
}

/** Local midnight on `iso`. Throws a RangeError if `iso` is not a real calendar date. */
export function parseISODate(iso: ISODate): Date {
  if (!isISODate(iso)) throw new RangeError(`Not a calendar date: ${iso}`)
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number]
  return localDate(year, month, day)
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now)
}

/** Calendar arithmetic on the local date, so clock changes never shift the day. */
export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso)
  return toISODate(localDate(date.getFullYear(), date.getMonth() + 1, date.getDate() + days))
}

/** The Monday that starts the week containing `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  const daysSinceMonday = (parseISODate(iso).getDay() + 6) % 7
  return addDays(iso, -daysSinceMonday)
}

/** The seven consecutive dates starting at `weekStart` (normally a Monday). */
export function weekDates(weekStart: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

/**
 * Calendar rows for a month view: weeks of seven dates, Monday first, covering
 * every day of the month (4 to 6 rows). `month` is 1 to 12.
 */
export function monthGrid(year: number, month: number): ISODate[][] {
  assertMonth(month)
  const lastDay = toISODate(localDate(year, month + 1, 0))
  const rows: ISODate[][] = []
  let weekStart = startOfWeek(toISODate(localDate(year, month, 1)))
  while (weekStart <= lastDay) {
    rows.push(weekDates(weekStart))
    weekStart = addDays(weekStart, 7)
  }
  return rows
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** A year and a month (1 to 12), for stepping through a calendar. */
export interface MonthRef {
  year: number
  /** 1 to 12 */
  month: number
}

export function monthRefOf(iso: ISODate): MonthRef {
  const date = parseISODate(iso)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function shiftMonth({ year, month }: MonthRef, by: number): MonthRef {
  const index = year * 12 + (month - 1) + by
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function firstOfMonth({ year, month }: MonthRef): ISODate {
  assertMonth(month)
  return toISODate(localDate(year, month, 1))
}

/** 'YYYY-MM' for a year and month: the key that ticks on monthly jobs are stored under. */
export function monthKey({ year, month }: MonthRef): ISOMonth {
  assertMonth(month)
  return `${pad(year, 4)}-${pad(month, 2)}`
}

const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/

/** True only for a real month written 'YYYY-MM' (so '2026-13' is false). */
export function isISOMonth(value: unknown): value is ISOMonth {
  if (typeof value !== 'string') return false
  const match = ISO_MONTH_PATTERN.exec(value)
  if (!match) return false
  const month = Number(match[2])
  return month >= 1 && month <= 12
}

/** The 'YYYY-MM' part of a date. */
export function monthKeyOf(iso: ISODate): ISOMonth {
  return monthKey(monthRefOf(iso))
}

// en-GB names, spelt out so output is identical in every browser.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function parts(iso: ISODate) {
  const date = parseISODate(iso)
  return {
    year: date.getFullYear(),
    monthName: MONTH_NAMES[date.getMonth()] ?? '',
    day: date.getDate(),
    dayName: DAY_NAMES[date.getDay()] ?? '',
  }
}

/** 'Mon 6' */
export function formatShortDay(iso: ISODate): string {
  const { dayName, day } = parts(iso)
  return `${dayName.slice(0, 3)} ${day}`
}

/** 'Monday 6 October' */
export function formatLongDate(iso: ISODate): string {
  const { dayName, day, monthName } = parts(iso)
  return `${dayName} ${day} ${monthName}`
}

/**
 * The Monday to Sunday week starting at `weekStart`: '6 to 12 October',
 * '29 September to 5 October', or '29 December 2025 to 4 January 2026'.
 */
export function formatWeekRange(weekStart: ISODate): string {
  const start = parts(weekStart)
  const end = parts(addDays(weekStart, 6))
  if (start.year !== end.year) {
    return `${start.day} ${start.monthName} ${start.year} to ${end.day} ${end.monthName} ${end.year}`
  }
  if (start.monthName !== end.monthName) {
    return `${start.day} ${start.monthName} to ${end.day} ${end.monthName}`
  }
  return `${start.day} to ${end.day} ${end.monthName}`
}

/** 'October 2026'. `month` is 1 to 12. */
export function formatMonthLabel(year: number, month: number): string {
  assertMonth(month)
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** 'October'. `month` is 1 to 12. */
export function monthName(month: number): string {
  assertMonth(month)
  return MONTH_NAMES[month - 1] ?? ''
}

/**
 * Months as a person would say them: 'March', 'March and April',
 * 'March to May', 'February, April and June', 'October to February'
 * (a run that wraps the year end stays one run). `months` are 1 to 12.
 */
export function formatMonths(months: readonly number[]): string {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  if (sorted.length === 12) return 'All year'
  // Split into runs of consecutive months.
  const runs: number[][] = []
  for (const month of sorted) {
    const last = runs.at(-1)
    if (last && last.at(-1) === month - 1) last.push(month)
    else runs.push([month])
  }
  // A run ending in December joins one starting in January.
  const first = runs[0]
  const last = runs.at(-1)
  if (runs.length > 1 && first && last && first[0] === 1 && last.at(-1) === 12) {
    runs.pop()
    runs[0] = [...last, ...first]
  }
  const names = runs.map((run) => {
    const start = monthName(run[0] ?? 1)
    const end = monthName(run.at(-1) ?? 1)
    if (run.length === 1) return start
    // 'March and April' on its own; 'March to April' when other runs follow, so the 'and's don't pile up.
    if (run.length === 2 && runs.length === 1) return `${start} and ${end}`
    return `${start} to ${end}`
  })
  if (names.length === 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}
