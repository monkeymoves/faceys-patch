import { describe, expect, it } from 'vitest'
import {
  buildAlmanac,
  cropCalendar,
  cropYear,
  groupJobsByKind,
  growableCrops,
  hasActivity,
  hiddenJobs,
  jobsForMonth,
  jobsToDo,
  sowingForMonth,
  type JobsInput,
} from './almanac'
import { ALMANAC, CATALOGUE, GUIDES, INGREDIENTS, JOBS, deepFreeze, makeMyJob, makeState } from './test-fixtures'
import type { Ingredient } from './types'

const byId = (id: string) => INGREDIENTS.find((ingredient) => ingredient.id === id) as Ingredient

const input = (overrides: Partial<JobsInput> = {}): JobsInput =>
  deepFreeze({
    almanac: ALMANAC,
    catalogue: CATALOGUE,
    state: makeState(),
    month: { year: 2026, month: 10 },
    today: '2026-10-07',
    ...overrides,
  })

describe('buildAlmanac', () => {
  it('keys guides by crop and keeps jobs in order', () => {
    const almanac = buildAlmanac(GUIDES, JOBS)
    expect(almanac.guides.get('tomato')?.sowIndoors).toEqual([2, 3, 4])
    expect(almanac.jobs).toBe(JOBS)
  })
})

describe('growableCrops', () => {
  it('lists what can be grown, A to Z', () => {
    expect(growableCrops(CATALOGUE).map((crop) => crop.id)).toEqual(['basil', 'courgette', 'potato', 'tomato'])
  })
})

describe('cropYear', () => {
  it('joins the guide with the harvest months', () => {
    expect(cropYear(byId('tomato'), ALMANAC)).toEqual({
      sowIndoors: [2, 3, 4],
      sowOutdoors: [],
      plantOut: [5, 6],
      harvest: [7, 8, 9],
    })
  })

  it('knows only the harvest for a crop without a guide', () => {
    const year = cropYear(byId('basil'), ALMANAC)
    expect(year).toEqual({ sowIndoors: [], sowOutdoors: [], plantOut: [], harvest: [6, 7, 8, 9] })
    expect(hasActivity(year)).toBe(true)
  })

  it('has no activity for an own crop with no guide and no harvest months yet', () => {
    const oca: Ingredient = { id: 'my-oca-a1b2c', name: 'Oca', aisle: 'veg', growable: true, art: 'seedling', harvestMonths: [] }
    expect(hasActivity(cropYear(oca, ALMANAC))).toBe(false)
  })
})

describe('cropCalendar', () => {
  it('lists every growable crop with something to show, A to Z', () => {
    expect(cropCalendar(ALMANAC, CATALOGUE).map((entry) => entry.ingredient.id)).toEqual([
      'basil',
      'courgette',
      'potato',
      'tomato',
    ])
  })
})

describe('sowingForMonth', () => {
  it('sorts crops into sow indoors, sow outdoors and plant out, A to Z', () => {
    const may = sowingForMonth(5, ALMANAC, CATALOGUE)
    expect(may.sowIndoors.map((crop) => crop.id)).toEqual(['courgette'])
    expect(may.sowOutdoors.map((crop) => crop.id)).toEqual(['courgette'])
    expect(may.plantOut.map((crop) => crop.id)).toEqual(['courgette', 'tomato'])
  })

  it('is empty in a month when nothing starts', () => {
    expect(sowingForMonth(12, ALMANAC, CATALOGUE)).toEqual({ sowIndoors: [], sowOutdoors: [], plantOut: [] })
  })

  it('skips a guide for a crop the catalogue no longer knows', () => {
    const almanac = buildAlmanac([{ ingredientId: 'long-gone', sowOutdoors: [5], tips: [] }], [])
    expect(sowingForMonth(5, almanac, CATALOGUE).sowOutdoors).toEqual([])
  })
})

describe('jobsForMonth', () => {
  it('gives the built-in jobs due that month, in JOB_KINDS order then data order, with a drawing where it has one', () => {
    const jobs = jobsForMonth(input())
    expect(jobs.map((job) => job.id)).toEqual(['net-brassicas', 'check-stores', 'mulch-beds'])
    expect(jobs[1]).toMatchObject({
      mine: false,
      done: false,
      doneKey: '2026-10',
      overdue: false,
      broughtForward: false,
      art: undefined,
    })
  })

  it('shows a drawing of the first crop a job is about', () => {
    const jobs = jobsForMonth(input({ month: { year: 2026, month: 1 } }))
    expect(jobs.find((job) => job.id === 'chit-seed-potatoes')?.art).toBe('potato')
  })

  it('leaves out jobs put aside', () => {
    const state = makeState({ hiddenJobs: ['check-stores'] })
    expect(jobsForMonth(input({ state })).map((job) => job.id)).toEqual(['net-brassicas', 'mulch-beds'])
  })

  it('reads ticks for the month on show only', () => {
    const state = makeState({ jobsDone: { '2026-10': ['mulch-beds'], '2025-10': ['check-stores'] } })
    const jobs = jobsForMonth(input({ state }))
    expect(jobs.find((job) => job.id === 'mulch-beds')?.done).toBe(true)
    expect(jobs.find((job) => job.id === 'check-stores')?.done).toBe(false)
  })

  it('puts my yearly jobs before the built-in ones of the same kind, A to Z', () => {
    const state = makeState({
      myJobs: [
        makeMyJob('my-b-22222', 'Tidy the shed', { kind: 'prepare', months: [10, 11] }),
        makeMyJob('my-a-11111', 'Order manure', { kind: 'prepare', months: [10] }),
        makeMyJob('my-c-33333', 'Water the greenhouse', { kind: 'tend', months: [6] }),
      ],
    })
    expect(jobsForMonth(input({ state })).map((job) => job.id)).toEqual([
      'net-brassicas',
      'check-stores',
      'my-a-11111',
      'my-b-22222',
      'mulch-beds',
    ])
    expect(jobsForMonth(input({ state }))[2]).toMatchObject({ mine: true, months: [10], doneKey: '2026-10' })
  })

  it('shows a one-off job in its own month, dated, with its tick kept under that month', () => {
    const state = makeState({
      myJobs: [
        makeMyJob('my-a-11111', 'Collect manure from Dave', { kind: 'prepare', months: [], on: '2026-10-24' }),
        makeMyJob('my-b-22222', 'Pick up the seed order', { kind: 'prepare', months: [], on: '2026-10-14' }),
      ],
      jobsDone: { '2026-10': ['my-b-22222'] },
    })
    const jobs = jobsForMonth(input({ state }))
    expect(jobs.map((job) => job.id)).toEqual(['net-brassicas', 'check-stores', 'my-b-22222', 'my-a-11111', 'mulch-beds'])
    expect(jobs[2]).toMatchObject({ on: '2026-10-14', done: true, overdue: false, doneKey: '2026-10' })
    expect(jobs[3]).toMatchObject({ on: '2026-10-24', done: false, overdue: false })
    expect(jobsForMonth(input({ state, month: { year: 2026, month: 11 } })).map((job) => job.id)).toEqual([
      'net-brassicas',
      'check-stores',
      'mulch-beds',
    ])
  })

  it('marks an undone one-off whose date has passed as overdue, but keeps it in its kind until it is from an earlier month', () => {
    const state = makeState({ myJobs: [makeMyJob('my-a-11111', 'Lift the dahlias', { months: [], on: '2026-10-03' })] })
    const job = jobsForMonth(input({ state })).find((candidate) => candidate.id === 'my-a-11111')
    expect(job).toMatchObject({ overdue: true, broughtForward: false, kind: 'tend' })
    expect(groupJobsByKind(jobsForMonth(input({ state }))).map((group) => group.kind)).toContain('tend')
  })

  it('does not call a one-off dated today overdue', () => {
    const state = makeState({ myJobs: [makeMyJob('my-a-11111', 'Today', { months: [], on: '2026-10-07' })] })
    expect(jobsForMonth(input({ state })).find((job) => job.id === 'my-a-11111')).toMatchObject({ overdue: false })
  })

  it('keeps listing a brought-forward one-off that was just ticked when asked to, so the row stays put', () => {
    const state = makeState({
      myJobs: [makeMyJob('my-a-11111', 'Fix the fence', { months: [], on: '2026-09-20' })],
      jobsDone: { '2026-09': ['my-a-11111'] },
    })
    expect(jobsForMonth(input({ state })).some((job) => job.id === 'my-a-11111')).toBe(false)
    const kept = jobsForMonth(input({ state, keep: new Set(['my-a-11111']) }))
    expect(kept[0]).toMatchObject({ id: 'my-a-11111', done: true, overdue: false, broughtForward: true, doneKey: '2026-09' })
  })

  it('brings undone one-offs from earlier months into this month as overdue, oldest first, and nowhere else', () => {
    const state = makeState({
      myJobs: [
        makeMyJob('my-a-11111', 'Fix the fence', { kind: 'prepare', months: [], on: '2026-09-20' }),
        makeMyJob('my-b-22222', 'Return the rotavator', { kind: 'prepare', months: [], on: '2026-08-02' }),
        makeMyJob('my-c-33333', 'Done already', { kind: 'prepare', months: [], on: '2026-09-01' }),
      ],
      jobsDone: { '2026-09': ['my-c-33333'] },
    })
    const now = jobsForMonth(input({ state }))
    expect(now.slice(0, 2).map((job) => job.id)).toEqual(['my-b-22222', 'my-a-11111'])
    expect(now[0]).toMatchObject({ overdue: true, broughtForward: true, doneKey: '2026-08', on: '2026-08-02' })
    // Not in a month that isn't today's.
    const next = jobsForMonth(input({ state, month: { year: 2026, month: 11 } }))
    expect(next.some((job) => job.overdue)).toBe(false)
    // And still in their own month, flagged.
    const september = jobsForMonth(input({ state, month: { year: 2026, month: 9 } }))
    expect(september.map((job) => job.id)).toContain('my-a-11111')
    expect(september.find((job) => job.id === 'my-a-11111')).toMatchObject({ overdue: true, broughtForward: false })
  })

  it('does not bring a future one-off forward', () => {
    const state = makeState({ myJobs: [makeMyJob('my-a-11111', 'Prune', { months: [], on: '2027-02-01' })] })
    expect(jobsForMonth(input({ state })).some((job) => job.mine)).toBe(false)
  })

  it('is deterministic', () => {
    expect(jobsForMonth(input())).toEqual(jobsForMonth(input()))
  })
})

describe('groupJobsByKind', () => {
  it('groups by kind in JOB_KINDS order, leaving out empty kinds and jobs brought forward', () => {
    const state = makeState({ myJobs: [makeMyJob('my-a-11111', 'Late', { kind: 'tend', months: [], on: '2026-09-01' })] })
    const groups = groupJobsByKind(jobsForMonth(input({ state })))
    expect(groups.map((group) => [group.kind, group.jobs.map((job) => job.id)])).toEqual([
      ['protect', ['net-brassicas']],
      ['harvest', ['check-stores']],
      ['prepare', ['mulch-beds']],
    ])
  })
})

describe('hiddenJobs and jobsToDo', () => {
  it('lists the built-in jobs put aside, in almanac order', () => {
    const state = makeState({ hiddenJobs: ['mulch-beds', 'chit-seed-potatoes', 'not-a-job'] })
    expect(hiddenJobs(ALMANAC, state).map((job) => job.id)).toEqual(['chit-seed-potatoes', 'mulch-beds'])
  })

  it('counts what is left to do, overdue included', () => {
    const state = makeState({
      myJobs: [makeMyJob('my-a-11111', 'Late', { months: [], on: '2026-09-01' })],
      jobsDone: { '2026-10': ['mulch-beds'] },
    })
    expect(jobsToDo(input({ state }))).toBe(3)
    expect(jobsToDo(input())).toBe(3)
  })
})
