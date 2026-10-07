import { describe, expect, it } from 'vitest'
import { AISLES, ART_KEYS, COURSES, DIETS } from '../domain/types'
import { CATALOGUE, INGREDIENTS, RECIPES, STARTER_LARDER } from './index'

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/
// The owner's house style forbids the em dash (U+2014) and the en dash (U+2013).
const FORBIDDEN_DASH = /[\u2013\u2014]/
const ASSUMED_IDS = ['salt', 'black-pepper', 'water']

const ingredientsById = CATALOGUE.ingredients

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

/** True if this id is a growable ingredient in the catalogue. */
function isGrowable(id: string): boolean {
  return ingredientsById.get(id)?.growable === true
}

const MEAT_FISH_IDS = new Set(INGREDIENTS.filter((i) => i.aisle === 'meat-fish').map((i) => i.id))
const DAIRY_EGG_IDS = new Set(INGREDIENTS.filter((i) => i.aisle === 'dairy-eggs').map((i) => i.id))
const NOT_VEGAN_EXTRAS = ['honey']

describe('ingredients', () => {
  it('has a sensible number of entries', () => {
    expect(INGREDIENTS.length).toBeGreaterThanOrEqual(140)
    expect(INGREDIENTS.length).toBeLessThanOrEqual(170)
  })

  it('has unique ids', () => {
    expect(duplicates(INGREDIENTS.map((i) => i.id)), 'duplicate ingredient ids').toEqual([])
  })

  it('exposes every ingredient through the catalogue map', () => {
    expect(ingredientsById.size).toBe(INGREDIENTS.length)
  })

  it.each(INGREDIENTS)('$id has a kebab-case id and a clean name', (ingredient) => {
    expect(ingredient.id).toMatch(KEBAB_CASE)
    expect(ingredient.name.trim()).not.toBe('')
    expect(ingredient.name).not.toMatch(FORBIDDEN_DASH)
  })

  it.each(INGREDIENTS)('$id uses a known aisle', (ingredient) => {
    expect(AISLES).toContain(ingredient.aisle)
  })

  it.each(INGREDIENTS.filter((i) => i.growable))(
    '$id (growable) has an art key and unique harvest months from 1 to 12',
    (ingredient) => {
      expect(ART_KEYS, `${ingredient.id} art`).toContain(ingredient.art)
      const months = ingredient.harvestMonths ?? []
      expect(months.length, `${ingredient.id} harvestMonths`).toBeGreaterThan(0)
      expect(new Set(months).size, `${ingredient.id} has repeated months`).toBe(months.length)
      for (const month of months) {
        expect(Number.isInteger(month), `${ingredient.id} month ${month}`).toBe(true)
        expect(month).toBeGreaterThanOrEqual(1)
        expect(month).toBeLessThanOrEqual(12)
      }
    },
  )

  it.each(INGREDIENTS.filter((i) => !i.growable))(
    '$id (not growable) has no art key or harvest months',
    (ingredient) => {
      expect(ingredient.art, `${ingredient.id} art`).toBeUndefined()
      expect(ingredient.harvestMonths, `${ingredient.id} harvestMonths`).toBeUndefined()
    },
  )

  it('has about 55 to 65 growable ingredients', () => {
    const count = INGREDIENTS.filter((i) => i.growable).length
    expect(count).toBeGreaterThanOrEqual(55)
    expect(count).toBeLessThanOrEqual(65)
  })

  it('marks only salt, black pepper and water as assumed', () => {
    const assumed = INGREDIENTS.filter((i) => i.assumed).map((i) => i.id)
    expect([...assumed].sort()).toEqual([...ASSUMED_IDS].sort())
  })

  it('never marks a growable ingredient as assumed', () => {
    expect(INGREDIENTS.filter((i) => i.growable && i.assumed).map((i) => i.id)).toEqual([])
  })

  it('does not split interchangeable variants into separate ingredients', () => {
    // A cook with pasta in the larder should never be told to buy spaghetti. Use the
    // single entry and put the shape or variant in the recipe amount instead.
    const SPLIT_VARIANTS: Record<string, string> = {
      spaghetti: 'pasta',
      penne: 'pasta',
      linguine: 'pasta',
      tagliatelle: 'pasta',
      rigatoni: 'pasta',
      orecchiette: 'pasta',
      'chicken-stock': 'vegetable-stock',
      'cannellini-beans': 'white-beans',
      'butter-beans': 'white-beans',
    }
    const offenders = INGREDIENTS.filter((i) => i.id in SPLIT_VARIANTS).map(
      (i) => `${i.id} (use ${SPLIT_VARIANTS[i.id]})`,
    )
    expect(offenders, 'ingredients that duplicate another one').toEqual([])
  })
})

describe('recipes', () => {
  it('has a sensible number of recipes', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(50)
  })

  it('has unique, kebab-case ids', () => {
    expect(duplicates(RECIPES.map((r) => r.id)), 'duplicate recipe ids').toEqual([])
    expect(RECIPES.filter((r) => !KEBAB_CASE.test(r.id)).map((r) => r.id), 'ids not kebab-case').toEqual([])
  })

  it('has unique titles', () => {
    expect(duplicates(RECIPES.map((r) => r.title.toLowerCase())), 'duplicate recipe titles').toEqual([])
  })

  describe.each(RECIPES)('$id', (recipe) => {
    it('has a title, a blurb and a known course', () => {
      expect(recipe.title.trim()).not.toBe('')
      expect(recipe.blurb.trim()).not.toBe('')
      expect(COURSES).toContain(recipe.course)
    })

    it('has positive whole minutes and serves', () => {
      expect(Number.isInteger(recipe.minutes), 'minutes').toBe(true)
      expect(recipe.minutes).toBeGreaterThan(0)
      expect(Number.isInteger(recipe.serves), 'serves').toBe(true)
      expect(recipe.serves).toBeGreaterThan(0)
    })

    it('has 4 to 8 non-empty steps', () => {
      expect(recipe.steps.length).toBeGreaterThanOrEqual(4)
      expect(recipe.steps.length).toBeLessThanOrEqual(8)
      expect(recipe.steps.filter((s) => s.trim() === '').length, 'empty steps').toBe(0)
    })

    it('has 5 to 12 ingredients', () => {
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(5)
      expect(recipe.ingredients.length).toBeLessThanOrEqual(12)
    })

    it('only uses ingredient ids that exist', () => {
      const unknown = recipe.ingredients.map((i) => i.id).filter((id) => !ingredientsById.has(id))
      expect(unknown, 'unknown ingredient ids').toEqual([])
    })

    it('lists each ingredient once', () => {
      expect(duplicates(recipe.ingredients.map((i) => i.id)), 'repeated ingredient ids').toEqual([])
    })

    it('gives every ingredient an amount', () => {
      const blank = recipe.ingredients.filter((i) => i.amount.trim() === '').map((i) => i.id)
      expect(blank, 'ingredients with no amount').toEqual([])
    })

    it('uses at least one growable ingredient', () => {
      expect(recipe.ingredients.some((i) => isGrowable(i.id))).toBe(true)
    })

    it('is built around at least one growable ingredient that is not optional', () => {
      expect(recipe.ingredients.some((i) => isGrowable(i.id) && !i.optional)).toBe(true)
    })

    it('uses no em or en dashes', () => {
      const texts = [
        recipe.title,
        recipe.blurb,
        ...recipe.steps,
        ...recipe.ingredients.flatMap((i) => [i.amount, i.prep ?? '']),
      ]
      expect(texts.filter((t) => FORBIDDEN_DASH.test(t)), 'text with a forbidden dash').toEqual([])
    })
  })

  it('uses every growable ingredient in at least 2 recipes', () => {
    const uses = new Map<string, number>()
    for (const recipe of RECIPES) {
      for (const { id } of recipe.ingredients) uses.set(id, (uses.get(id) ?? 0) + 1)
    }
    const underused = INGREDIENTS.filter((i) => i.growable && (uses.get(i.id) ?? 0) < 2).map(
      (i) => `${i.id} (${uses.get(i.id) ?? 0})`,
    )
    expect(underused, 'growable ingredients used in fewer than 2 recipes').toEqual([])
  })

  it('has every growable vegetable and fruit as a required ingredient somewhere, not only a garnish', () => {
    const required = new Set(RECIPES.flatMap((r) => r.ingredients.filter((i) => !i.optional).map((i) => i.id)))
    const garnishOnly = INGREDIENTS.filter((i) => i.growable && i.aisle !== 'herbs' && !required.has(i.id)).map(
      (i) => i.id,
    )
    expect(garnishOnly, 'growable veg or fruit that is only ever optional').toEqual([])
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('has at least 8 recipes in season in month %i', (month) => {
    const inSeason = RECIPES.filter((recipe) =>
      recipe.ingredients.some((i) => ingredientsById.get(i.id)?.harvestMonths?.includes(month)),
    )
    expect(inSeason.length, `recipes in season in month ${month}`).toBeGreaterThanOrEqual(8)
  })
})

describe('diet tags', () => {
  it('has a roughly 70/30 split between vegetarian and meat or fish recipes', () => {
    const vegetarian = RECIPES.filter((r) => r.diet.includes('vegetarian')).length
    const share = vegetarian / RECIPES.length
    expect(share).toBeGreaterThanOrEqual(0.6)
    expect(share).toBeLessThanOrEqual(0.8)
  })

  it('only ever uses known diet tags, once each', () => {
    const bad = RECIPES.filter(
      (r) =>
        r.diet.some((d) => !DIETS.includes(d)) || new Set(r.diet).size !== r.diet.length,
    ).map((r) => r.id)
    expect(bad).toEqual([])
  })

  it('lists vegetarian alongside vegan', () => {
    const bad = RECIPES.filter((r) => r.diet.includes('vegan') && !r.diet.includes('vegetarian')).map((r) => r.id)
    expect(bad, 'vegan recipes missing the vegetarian tag').toEqual([])
  })

  it('keeps meat and fish out of vegetarian recipes', () => {
    const bad = RECIPES.filter(
      (r) => r.diet.includes('vegetarian') && r.ingredients.some((i) => MEAT_FISH_IDS.has(i.id)),
    ).map((r) => `${r.id}: ${r.ingredients.filter((i) => MEAT_FISH_IDS.has(i.id)).map((i) => i.id).join(', ')}`)
    expect(bad, 'vegetarian recipes containing meat or fish').toEqual([])
  })

  it('tags every recipe without meat or fish as vegetarian', () => {
    const bad = RECIPES.filter(
      (r) => !r.diet.includes('vegetarian') && !r.ingredients.some((i) => MEAT_FISH_IDS.has(i.id)),
    ).map((r) => r.id)
    expect(bad, 'recipes with no meat or fish that are not tagged vegetarian').toEqual([])
  })

  it('keeps dairy, eggs and honey out of vegan recipes', () => {
    const isNotVegan = (id: string) => DAIRY_EGG_IDS.has(id) || NOT_VEGAN_EXTRAS.includes(id)
    const bad = RECIPES.filter((r) => r.diet.includes('vegan') && r.ingredients.some((i) => isNotVegan(i.id))).map(
      (r) => `${r.id}: ${r.ingredients.filter((i) => isNotVegan(i.id)).map((i) => i.id).join(', ')}`,
    )
    expect(bad, 'vegan recipes containing dairy, eggs or honey').toEqual([])
  })
})

describe('starter larder', () => {
  it('has about 15 to 20 ingredients', () => {
    expect(STARTER_LARDER.length).toBeGreaterThanOrEqual(15)
    expect(STARTER_LARDER.length).toBeLessThanOrEqual(20)
  })

  it('has unique ids', () => {
    expect(duplicates([...STARTER_LARDER]), 'repeated starter larder ids').toEqual([])
  })

  it('only lists ingredients that exist', () => {
    expect(STARTER_LARDER.filter((id) => !ingredientsById.has(id)), 'unknown starter larder ids').toEqual([])
  })
})

describe('catalogue', () => {
  it('is built from the same ingredients and recipes', () => {
    expect(CATALOGUE.recipes).toBe(RECIPES)
    expect([...CATALOGUE.ingredients.values()]).toEqual([...INGREDIENTS])
  })
})
