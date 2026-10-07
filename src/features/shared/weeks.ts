import { formatWeekRange, parseISODate, type ISODate } from '../../domain'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** 'This week', 'Next week', 'Last week', 'In 3 weeks' or '2 weeks ago'. Both dates are Mondays. */
export function relativeWeek(weekStart: ISODate, thisWeek: ISODate): string {
  // Rounded, so a clock change inside the span doesn't matter.
  const weeks = Math.round((parseISODate(weekStart).getTime() - parseISODate(thisWeek).getTime()) / WEEK_MS)
  if (weeks === 0) return 'This week'
  if (weeks === 1) return 'Next week'
  if (weeks === -1) return 'Last week'
  return weeks > 0 ? `In ${weeks} weeks` : `${-weeks} weeks ago`
}

/** 'This week, 5 to 11 October': the label between the previous and next week buttons. */
export function weekLabel(weekStart: ISODate, thisWeek: ISODate): string {
  return `${relativeWeek(weekStart, thisWeek)}, ${formatWeekRange(weekStart)}`
}
