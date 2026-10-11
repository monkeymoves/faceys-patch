import { describe, expect, it, vi } from 'vitest'
import {
  addDays,
  firstOfMonth,
  formatLongDate,
  formatMonthLabel,
  formatMonths,
  formatShortDay,
  formatWeekRange,
  isISODate,
  isISOMonth,
  isSameMonth,
  monthGrid,
  monthKey,
  monthKeyOf,
  monthName,
  monthRefOf,
  parseISODate,
  shiftMonth,
  startOfWeek,
  toISODate,
  todayISO,
  weekDates,
} from './dates'

describe('toISODate', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses the local calendar day just after midnight in summer time (where toISOString would slip a day)', () => {
    expect(toISODate(new Date(2026, 5, 1, 0, 30))).toBe('2026-06-01')
  })

  it('uses the local calendar day just before midnight', () => {
    expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})

describe('isISODate', () => {
  it.each(['2026-10-07', '2026-01-01', '2026-12-31', '2028-02-29', '2000-02-29'])(
    'accepts the real calendar date %s',
    (value) => {
      expect(isISODate(value)).toBe(true)
    },
  )

  it.each([
    ['a day past the end of February', '2026-02-30'],
    ['29 February in a non-leap year', '2026-02-29'],
    ['29 February in a century non-leap year', '2100-02-29'],
    ['month 13', '2026-13-01'],
    ['month 00', '2026-00-10'],
    ['day 00', '2026-10-00'],
    ['31 April', '2026-04-31'],
    ['missing zero padding', '2026-1-5'],
    ['a timestamp', '2026-10-07T00:00:00'],
    ['surrounding spaces', ' 2026-10-07 '],
    ['an empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(isISODate(value)).toBe(false)
  })

  it.each([null, undefined, 20261007, new Date(2026, 9, 7), {}])('rejects the non-string %s', (value) => {
    expect(isISODate(value)).toBe(false)
  })
})

describe('parseISODate', () => {
  it('returns local midnight on that calendar day', () => {
    const date = parseISODate('2026-06-15')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 5, 15])
    expect([date.getHours(), date.getMinutes()]).toEqual([0, 0])
  })

  it('round-trips with toISODate on both UK clock-change days', () => {
    expect(toISODate(parseISODate('2026-03-29'))).toBe('2026-03-29')
    expect(toISODate(parseISODate('2026-10-25'))).toBe('2026-10-25')
  })

  it('throws a RangeError for anything that is not a real calendar date', () => {
    expect(() => parseISODate('2026-02-30')).toThrow(RangeError)
    expect(() => parseISODate('next tuesday')).toThrow(RangeError)
  })
})

describe('todayISO', () => {
  it('is the local calendar date of the given moment', () => {
    expect(todayISO(new Date(2026, 9, 7, 0, 5))).toBe('2026-10-07')
  })

  it('defaults to now', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 25, 23, 30) })
    try {
      expect(todayISO()).toBe('2026-10-25')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('addDays', () => {
  it.each([
    ['2026-10-07', 1, '2026-10-08'],
    ['2026-10-07', 0, '2026-10-07'],
    ['2026-10-07', -7, '2026-09-30'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-02-29', 1, '2028-03-01'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-03-28', 1, '2026-03-29'],
    ['2026-03-29', 1, '2026-03-30'],
    ['2026-03-30', -2, '2026-03-28'],
    ['2026-10-24', 1, '2026-10-25'],
    ['2026-10-25', 1, '2026-10-26'],
    ['2026-10-20', 14, '2026-11-03'],
  ])('%s plus %i days is %s', (iso, days, expected) => {
    expect(addDays(iso, days)).toBe(expected)
  })
})

describe('startOfWeek', () => {
  it.each([
    ['a Monday is its own week start', '2026-10-05', '2026-10-05'],
    ['a Wednesday', '2026-10-07', '2026-10-05'],
    ['a Sunday belongs to the week before', '2026-10-11', '2026-10-05'],
    ['the Sunday the clocks go forward', '2026-03-29', '2026-03-23'],
    ['the Sunday the clocks go back', '2026-10-25', '2026-10-19'],
    ['a week that spans new year', '2026-01-01', '2025-12-29'],
    ['a leap day', '2028-02-29', '2028-02-28'],
  ])('%s', (_label, iso, expected) => {
    expect(startOfWeek(iso)).toBe(expected)
  })
})

describe('weekDates', () => {
  it('lists the seven days from Monday to Sunday', () => {
    expect(weekDates('2026-10-05')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
  })

  it('is unaffected by the clocks going back on the Sunday', () => {
    expect(weekDates('2026-10-19')).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })

  it('runs across the end of a leap February', () => {
    expect(weekDates('2028-02-28')).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
      '2028-03-02',
      '2028-03-03',
      '2028-03-04',
      '2028-03-05',
    ])
  })
})

describe('monthGrid', () => {
  it('covers October 2026 in five Monday-first rows, padded with days from the months either side', () => {
    const grid = monthGrid(2026, 10)
    expect(grid).toHaveLength(5)
    expect(grid[0]).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ])
    expect(grid[4]).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })

  it('needs only four rows when a 28-day February starts on a Monday', () => {
    const grid = monthGrid(2027, 2)
    expect(grid).toHaveLength(4)
    expect(grid[0]?.[0]).toBe('2027-02-01')
    expect(grid[3]?.[6]).toBe('2027-02-28')
  })

  it('needs six rows when a 31-day month starts on a Sunday', () => {
    const grid = monthGrid(2026, 3)
    expect(grid).toHaveLength(6)
    expect(grid[0]?.[6]).toBe('2026-03-01')
    expect(grid[5]?.slice(0, 2)).toEqual(['2026-03-30', '2026-03-31'])
  })

  it('includes the leap day in a leap February', () => {
    const grid = monthGrid(2028, 2)
    expect(grid).toHaveLength(5)
    expect(grid[4]?.[1]).toBe('2028-02-29')
    expect(grid[4]?.[2]).toBe('2028-03-01')
  })

  it('every row is seven consecutive days starting on a Monday, including across the clock change', () => {
    for (const row of monthGrid(2026, 3)) {
      expect(row).toHaveLength(7)
      expect(row).toEqual(weekDates(startOfWeek(row[0] ?? '')))
    }
  })

  it.each([0, 13, 1.5])('throws a RangeError for month %s', (month) => {
    expect(() => monthGrid(2026, month)).toThrow(RangeError)
  })
})

describe('isSameMonth', () => {
  it.each([
    ['2026-10-01', '2026-10-31', true],
    ['2026-10-31', '2026-11-01', false],
    ['2025-10-01', '2026-10-01', false],
  ])('%s and %s: %s', (a, b, expected) => {
    expect(isSameMonth(a, b)).toBe(expected)
  })
})

describe('formatShortDay', () => {
  it.each([
    ['2025-10-06', 'Mon 6'],
    ['2025-10-12', 'Sun 12'],
    ['2026-10-25', 'Sun 25'],
    ['2028-02-29', 'Tue 29'],
  ])('%s is %s', (iso, expected) => {
    expect(formatShortDay(iso)).toBe(expected)
  })
})

describe('formatLongDate', () => {
  it.each([
    ['2025-10-06', 'Monday 6 October'],
    ['2026-03-29', 'Sunday 29 March'],
    ['2027-01-01', 'Friday 1 January'],
  ])('%s is %s', (iso, expected) => {
    expect(formatLongDate(iso)).toBe(expected)
  })
})

describe('formatWeekRange', () => {
  it('names the month once when the week sits inside one month', () => {
    expect(formatWeekRange('2025-10-06')).toBe('6 to 12 October')
  })

  it('names both months when the week crosses into the next month', () => {
    expect(formatWeekRange('2025-09-29')).toBe('29 September to 5 October')
  })

  it('adds both years when the week crosses into a new year', () => {
    expect(formatWeekRange('2025-12-29')).toBe('29 December 2025 to 4 January 2026')
  })

  it('is unaffected by the clocks going back mid-week', () => {
    expect(formatWeekRange('2026-10-19')).toBe('19 to 25 October')
  })
})

describe('formatMonthLabel', () => {
  it.each([
    [2026, 10, 'October 2026'],
    [2027, 1, 'January 2027'],
    [2026, 12, 'December 2026'],
  ])('%i-%i is %s', (year, month, expected) => {
    expect(formatMonthLabel(year, month)).toBe(expected)
  })

  it('throws a RangeError for a month outside 1 to 12', () => {
    expect(() => formatMonthLabel(2026, 13)).toThrow(RangeError)
  })
})

describe('month refs', () => {
  it('reads the year and month of a date', () => {
    expect(monthRefOf('2026-10-07')).toEqual({ year: 2026, month: 10 })
  })

  it('steps forwards and backwards across year ends', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
    expect(shiftMonth({ year: 2026, month: 3 }, 14)).toEqual({ year: 2027, month: 5 })
  })

  it('gives the first of the month', () => {
    expect(firstOfMonth({ year: 2026, month: 2 })).toBe('2026-02-01')
  })

  it('writes a month key with padding, and reads one off a date', () => {
    expect(monthKey({ year: 2026, month: 3 })).toBe('2026-03')
    expect(monthKeyOf('2026-10-07')).toBe('2026-10')
    expect(() => monthKey({ year: 2026, month: 0 })).toThrow(RangeError)
  })

  it('recognises a month key and nothing else', () => {
    expect(isISOMonth('2026-10')).toBe(true)
    expect(isISOMonth('2026-13')).toBe(false)
    expect(isISOMonth('2026-00')).toBe(false)
    expect(isISOMonth('2026-10-07')).toBe(false)
    expect(isISOMonth(202610)).toBe(false)
  })
})

describe('monthName and formatMonths', () => {
  it('names a month', () => {
    expect(monthName(1)).toBe('January')
    expect(() => monthName(13)).toThrow(RangeError)
  })

  it.each([
    [[3], 'March'],
    [[3, 4], 'March and April'],
    [[3, 4, 5], 'March to May'],
    [[2, 4, 6], 'February, April and June'],
    [[1, 2, 10, 11, 12], 'October to February'],
    [[12, 1], 'December and January'],
    [[4, 5, 9, 10], 'April to May and September to October'],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'All year'],
    [[], ''],
  ])('%j reads as %s', (months, expected) => {
    expect(formatMonths(months)).toBe(expected)
  })

  it('ignores order and repeats', () => {
    expect(formatMonths([5, 3, 4, 3])).toBe('March to May')
  })
})
