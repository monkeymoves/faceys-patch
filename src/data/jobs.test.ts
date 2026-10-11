import { describe, expect, it } from 'vitest'
import { JOB_KINDS } from '../domain/types'
import { INGREDIENTS } from './ingredients'
import { JOBS } from './jobs'

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/
// House style: no en dash (U+2013) or em dash (U+2014), and plain apostrophes
// rather than curly quotes (U+2018, U+2019).
const FORBIDDEN_CHARACTERS = /[–—‘’]/
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const ingredientsById = new Map(INGREDIENTS.map((i) => [i.id, i]))

function duplicates(values: readonly (string | number)[]): (string | number)[] {
  const seen = new Set<string | number>()
  const repeated = new Set<string | number>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

const jobsIn = (month: number) => JOBS.filter((job) => job.months.includes(month))

describe('jobs', () => {
  it('has a sensible number of jobs', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(70)
    expect(JOBS.length).toBeLessThanOrEqual(110)
  })

  it('has unique, kebab-case ids', () => {
    expect(duplicates(JOBS.map((j) => j.id)), 'duplicate job ids').toEqual([])
    expect(JOBS.filter((j) => !KEBAB_CASE.test(j.id)).map((j) => j.id), 'ids not kebab-case').toEqual([])
  })

  it('has unique titles', () => {
    expect(duplicates(JOBS.map((j) => j.title.toLowerCase())), 'duplicate job titles').toEqual([])
  })

  describe.each(JOBS)('$id', (job) => {
    it('has a short title with no trailing full stop', () => {
      expect(job.title.trim()).not.toBe('')
      expect(job.title.length).toBeLessThanOrEqual(60)
      expect(job.title).not.toMatch(/\.$/)
    })

    it('has a note of at most 320 characters', () => {
      expect(job.note.trim()).not.toBe('')
      expect(job.note.length).toBeLessThanOrEqual(320)
    })

    it('uses no en or em dashes and no curly quotes', () => {
      expect(job.title).not.toMatch(FORBIDDEN_CHARACTERS)
      expect(job.note).not.toMatch(FORBIDDEN_CHARACTERS)
    })

    it('has a known kind', () => {
      expect(JOB_KINDS).toContain(job.kind)
    })

    it('has unique months from 1 to 12, in ascending order', () => {
      expect(job.months.length).toBeGreaterThan(0)
      for (const month of job.months) {
        expect(Number.isInteger(month), `month ${month}`).toBe(true)
        expect(month).toBeGreaterThanOrEqual(1)
        expect(month).toBeLessThanOrEqual(12)
      }
      expect(duplicates(job.months), 'repeated months').toEqual([])
      expect([...job.months]).toEqual([...job.months].sort((a, b) => a - b))
    })

    it('only names growable crops that exist, once each', () => {
      if (job.crops === undefined) return
      expect(job.crops.length, 'crops is empty: leave it out instead').toBeGreaterThan(0)
      expect(job.crops.filter((id) => !ingredientsById.has(id)), 'unknown crop ids').toEqual([])
      expect(
        job.crops.filter((id) => ingredientsById.get(id)?.growable === false),
        'crops that are not growable',
      ).toEqual([])
      expect(duplicates(job.crops), 'repeated crop ids').toEqual([])
    })
  })

  it.each(MONTHS)('has between 9 and 16 jobs in month %i', (month) => {
    const count = jobsIn(month).length
    expect(count, `jobs in month ${month}`).toBeGreaterThanOrEqual(9)
    expect(count, `jobs in month ${month}`).toBeLessThanOrEqual(16)
  })

  it.each(MONTHS)('has at least three kinds of job in month %i', (month) => {
    const kinds = new Set(jobsIn(month).map((job) => job.kind))
    expect(kinds.size, `kinds in month ${month}`).toBeGreaterThanOrEqual(3)
  })

  it.each(JOB_KINDS)('has at least 6 %s jobs', (kind) => {
    expect(JOBS.filter((job) => job.kind === kind).length).toBeGreaterThanOrEqual(6)
  })
})
