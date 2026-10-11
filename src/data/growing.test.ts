import { describe, expect, it } from 'vitest'
import type { CropGuide } from '../domain/types'
import { CROP_GUIDES } from './growing'
import { INGREDIENTS } from './ingredients'

// The owner's house style forbids the em dash (U+2014) and the en dash (U+2013).
const FORBIDDEN_DASH = /[–—]/
// Plain apostrophes only: no curly single quotes (U+2018, U+2019).
const CURLY_QUOTE = /[‘’]/
const MONTH_LISTS = ['sowIndoors', 'sowOutdoors', 'plantOut'] as const

const ingredientsById = new Map(INGREDIENTS.map((i) => [i.id, i]))
const growableIds = INGREDIENTS.filter((i) => i.growable).map((i) => i.id)

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function earliest(months: readonly number[]): number {
  return Math.min(...months)
}

function harvestMonthsOf(guide: CropGuide): readonly number[] {
  return ingredientsById.get(guide.ingredientId)?.harvestMonths ?? []
}

describe('crop guides', () => {
  it('has exactly one guide for every growable ingredient', () => {
    const ids = CROP_GUIDES.map((g) => g.ingredientId)
    expect(duplicates(ids), 'ingredients with more than one guide').toEqual([])
    expect(growableIds.filter((id) => !ids.includes(id)), 'growable ingredients with no guide').toEqual([])
  })

  it('only points at growable ingredients that exist', () => {
    const unknown = CROP_GUIDES.filter((g) => !ingredientsById.has(g.ingredientId)).map((g) => g.ingredientId)
    expect(unknown, 'guides for unknown ingredients').toEqual([])
    const notGrowable = CROP_GUIDES.filter((g) => ingredientsById.get(g.ingredientId)?.growable === false).map(
      (g) => g.ingredientId,
    )
    expect(notGrowable, 'guides for ingredients you buy rather than grow').toEqual([])
  })

  it('lists guides in the same order as the ingredients', () => {
    expect(CROP_GUIDES.map((g) => g.ingredientId)).toEqual(growableIds)
  })
})

describe.each(CROP_GUIDES)('$ingredientId', (guide) => {
  it('says when to sow or plant it', () => {
    expect(MONTH_LISTS.some((key) => guide[key] !== undefined)).toBe(true)
  })

  it.each(MONTH_LISTS)('has %s as unique, ascending whole months from 1 to 12 when given', (key) => {
    const months = guide[key]
    if (months === undefined) return
    expect(months.length, `${key} is empty`).toBeGreaterThan(0)
    for (const month of months) {
      expect(Number.isInteger(month), `${key} month ${month}`).toBe(true)
      expect(month, `${key} month`).toBeGreaterThanOrEqual(1)
      expect(month, `${key} month`).toBeLessThanOrEqual(12)
    }
    const sortedUnique = [...new Set(months)].sort((a, b) => a - b)
    expect([...months], `${key} must be unique and ascending`).toEqual(sortedUnique)
  })

  it('has 2 to 4 tips, none blank, each under 200 characters', () => {
    expect(guide.tips.length).toBeGreaterThanOrEqual(2)
    expect(guide.tips.length).toBeLessThanOrEqual(4)
    expect(guide.tips.filter((t) => t.trim() === ''), 'blank tips').toEqual([])
    expect(guide.tips.filter((t) => t.length >= 200), 'tips of 200 characters or more').toEqual([])
  })

  it('uses no em or en dashes and no curly quotes', () => {
    expect(guide.tips.filter((t) => FORBIDDEN_DASH.test(t)), 'tips with a forbidden dash').toEqual([])
    expect(guide.tips.filter((t) => CURLY_QUOTE.test(t)), 'tips with a curly quote').toEqual([])
  })

  it('is for a crop that is harvested at some point', () => {
    expect(harvestMonthsOf(guide).length).toBeGreaterThan(0)
  })
})

describe('sowing and planting order (sanity checks)', () => {
  // Autumn sowings under cover are planted out the following year, so skip those
  // rather than compare across the year end.
  const sownIndoorsThenPlanted = CROP_GUIDES.filter(
    (g) => g.sowIndoors !== undefined && g.plantOut !== undefined && !g.sowIndoors.some((m) => m >= 9),
  )

  it.each(sownIndoorsThenPlanted)('$ingredientId is planted out after it is first sown indoors', (guide) => {
    expect(earliest(guide.plantOut ?? [])).toBeGreaterThan(earliest(guide.sowIndoors ?? []))
  })

  // Crops sown straight into the ground and only picked in the growing season.
  const directSownSummerCrops = CROP_GUIDES.filter((g) => {
    const harvest = harvestMonthsOf(g)
    return (
      g.sowOutdoors !== undefined &&
      g.sowIndoors === undefined &&
      g.plantOut === undefined &&
      harvest.length > 0 &&
      harvest.every((m) => m >= 5 && m <= 10)
    )
  })

  it.each(directSownSummerCrops)('$ingredientId is sown before it is first harvested', (guide) => {
    expect(earliest(guide.sowOutdoors ?? [])).toBeLessThan(earliest(harvestMonthsOf(guide)))
  })
})
