import type { ISODate } from './types'

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
