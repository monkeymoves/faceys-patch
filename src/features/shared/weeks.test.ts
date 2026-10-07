import { describe, expect, it } from 'vitest'
import { relativeWeek, weekLabel } from './weeks'

const THIS_WEEK = '2026-10-05'

describe('relativeWeek', () => {
  it.each([
    ['2026-10-05', 'This week'],
    ['2026-10-12', 'Next week'],
    ['2026-09-28', 'Last week'],
    ['2026-10-26', 'In 3 weeks'],
    ['2026-09-21', '2 weeks ago'],
    // Across the clocks going back on 25 October.
    ['2026-11-02', 'In 4 weeks'],
  ])('calls the week of %s "%s"', (weekStart, expected) => {
    expect(relativeWeek(weekStart, THIS_WEEK)).toBe(expected)
  })
})

describe('weekLabel', () => {
  it('says which week and its dates in plain words', () => {
    expect(weekLabel(THIS_WEEK, THIS_WEEK)).toBe('This week, 5 to 11 October')
    expect(weekLabel('2026-10-26', THIS_WEEK)).toBe('In 3 weeks, 26 October to 1 November')
  })
})
