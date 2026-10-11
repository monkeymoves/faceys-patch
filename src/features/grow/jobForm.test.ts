import { describe, expect, it } from 'vitest'
import { checkJobDraft, draftFromJob, emptyJobDraft, type JobDraft } from './jobForm'

const draft = (overrides: Partial<JobDraft> = {}): JobDraft => ({
  ...emptyJobDraft(10),
  title: 'Net the strawberries',
  ...overrides,
})

describe('emptyJobDraft', () => {
  it('starts as a yearly job in the month on show, with any prefill', () => {
    expect(emptyJobDraft(5)).toEqual({ title: '', note: '', kind: 'tend', repeat: 'yearly', months: [5], on: '' })
    expect(emptyJobDraft(5, { title: 'Sow peas outside', kind: 'sow' })).toMatchObject({
      title: 'Sow peas outside',
      kind: 'sow',
    })
  })
})

describe('draftFromJob', () => {
  it('fills a draft from a yearly job and from a one-off', () => {
    expect(draftFromJob({ id: 'my-a-11111', title: 'A', note: 'n', kind: 'sow', months: [3, 4] })).toEqual({
      title: 'A',
      note: 'n',
      kind: 'sow',
      repeat: 'yearly',
      months: [3, 4],
      on: '',
    })
    expect(draftFromJob({ id: 'my-a-11111', title: 'A', note: '', kind: 'tend', months: [], on: '2026-10-14' })).toEqual(
      { title: 'A', note: '', kind: 'tend', repeat: 'once', months: [], on: '2026-10-14' },
    )
  })
})

describe('checkJobDraft', () => {
  it('turns a good yearly draft into a job, trimming text and sorting months', () => {
    const result = checkJobDraft(draft({ title: '  Net the strawberries ', note: ' Before the blackbirds. ', months: [6, 5] }), 'my-net-a1b2c')
    expect(result).toEqual({
      ok: true,
      job: { id: 'my-net-a1b2c', title: 'Net the strawberries', note: 'Before the blackbirds.', kind: 'tend', months: [5, 6] },
    })
  })

  it('turns a good one-off draft into a dated job with no months', () => {
    const result = checkJobDraft(draft({ repeat: 'once', on: '2026-10-14' }), 'my-net-a1b2c')
    expect(result).toEqual({
      ok: true,
      job: { id: 'my-net-a1b2c', title: 'Net the strawberries', note: '', kind: 'tend', months: [], on: '2026-10-14' },
    })
  })

  it('asks for a title, and keeps it short', () => {
    expect(checkJobDraft(draft({ title: '  ' }), 'my-a-11111')).toEqual({ ok: false, errors: { title: 'Give it a title.' } })
    expect(checkJobDraft(draft({ title: 'x'.repeat(81) }), 'my-a-11111')).toMatchObject({
      ok: false,
      errors: { title: 'Keep the title to 80 characters or fewer.' },
    })
  })

  it('asks for at least one month, or a real date', () => {
    expect(checkJobDraft(draft({ months: [] }), 'my-a-11111')).toEqual({ ok: false, errors: { months: 'Pick at least one month.' } })
    expect(checkJobDraft(draft({ repeat: 'once', on: '' }), 'my-a-11111')).toEqual({ ok: false, errors: { on: 'Pick a date.' } })
    expect(checkJobDraft(draft({ repeat: 'once', on: '2026-02-30' }), 'my-a-11111')).toEqual({ ok: false, errors: { on: 'Pick a date.' } })
  })

  it('keeps the note short, and reports every problem at once', () => {
    const result = checkJobDraft(draft({ title: '', note: 'x'.repeat(321), months: [] }), 'my-a-11111')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['months', 'note', 'title'])
  })

  it('refuses an id that is not the person\'s own', () => {
    expect(checkJobDraft(draft(), 'mulch-beds').ok).toBe(false)
  })
})
