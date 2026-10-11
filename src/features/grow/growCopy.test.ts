import { describe, expect, it } from 'vitest'
import type { JobView } from '../../domain'
import { firstSentence, jobAbout, jobHint, jobsLeftText, whenText } from './growCopy'

const view = (overrides: Partial<JobView> = {}): JobView => ({
  id: 'x',
  title: 'X',
  note: '',
  kind: 'tend',
  mine: false,
  months: [10],
  overdue: false,
  broughtForward: false,
  done: false,
  doneKey: '2026-10',
  ...overrides,
})

describe('whenText', () => {
  it('says when a yearly job comes round', () => {
    expect(whenText({ months: [10] })).toBe('Every October')
    expect(whenText({ months: [10, 11] })).toBe('Every October and November')
    expect(whenText({ months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })).toBe('Every month')
  })

  it('dates a one-off, and says so once it has passed', () => {
    expect(whenText({ months: [], on: '2026-10-14' })).toBe('Wednesday 14 October')
    expect(whenText({ months: [], on: '2026-10-03', overdue: true })).toBe('Was due Saturday 3 October')
  })
})

describe('firstSentence and jobHint', () => {
  it('takes the first sentence of a note', () => {
    expect(firstSentence('Stand them in egg boxes. Short shoots by March.')).toBe('Stand them in egg boxes.')
    expect(firstSentence('Does it work? Yes.')).toBe('Does it work?')
    expect(firstSentence('')).toBe('')
    expect(firstSentence('No full stop at all')).toBe('No full stop at all')
    expect(firstSentence('Plant 2.5cm deep. Then water.')).toBe('Plant 2.5cm deep.')
  })

  it('hints with the date for a one-off, otherwise the start of the note, otherwise nothing', () => {
    expect(jobHint(view({ on: '2026-10-14', note: 'Ask Dave.' }))).toBe('Wednesday 14 October')
    expect(jobHint(view({ note: 'One thing. Another.' }))).toBe('One thing.')
    expect(jobHint(view())).toBeUndefined()
  })
})

describe('summaries', () => {
  it('counts what is left', () => {
    expect(jobsLeftText(0, 0)).toBe('Nothing on the list this month')
    expect(jobsLeftText(0, 1)).toBe('Done')
    expect(jobsLeftText(0, 5)).toBe('All 5 done')
    expect(jobsLeftText(2, 5)).toBe('2 of 5 still to do')
  })

  it('suggests a job title from the activity a crop was reached through', () => {
    expect(jobAbout('Tomatoes', 'sowIndoors')).toEqual({ title: 'Sow tomatoes under cover', kind: 'sow' })
    expect(jobAbout('Carrots', 'sowOutdoors')).toEqual({ title: 'Sow carrots outside', kind: 'sow' })
    expect(jobAbout('Leeks', 'plantOut')).toEqual({ title: 'Plant leeks', kind: 'plant' })
    expect(jobAbout('Brussels sprouts', 'sowIndoors')).toEqual({ title: 'Sow Brussels sprouts under cover', kind: 'sow' })
    expect(jobAbout('Kale', undefined)).toEqual({ title: '', kind: 'tend' })
  })
})
