import { describe, expect, it } from 'vitest'
import { AISLES, buildCatalogue, LIMITS, type Ingredient } from '../../domain'
import { AISLE_OPTIONS, findByName, findOrMakeIngredient } from './ingredients'

const INGREDIENTS: Ingredient[] = [
  { id: 'courgette', name: 'Courgettes', aisle: 'veg', growable: true, art: 'courgette', harvestMonths: [7] },
  { id: 'mushroom', name: 'Mushrooms', aisle: 'veg', growable: false },
  { id: 'gruyere', name: 'Gruyère', aisle: 'dairy-eggs', growable: false },
  { id: 'salt', name: 'Salt', aisle: 'spices', growable: false, assumed: true },
  { id: 'my-oca-a1b2c', name: 'Oca', aisle: 'veg', growable: true, art: 'seedling', harvestMonths: [] },
]
const catalogue = buildCatalogue(INGREDIENTS, [])

describe('AISLE_OPTIONS', () => {
  it('offers every aisle, in shop order, with its label', () => {
    expect(AISLE_OPTIONS.map((option) => option.value)).toEqual([...AISLES])
    expect(AISLE_OPTIONS[3]).toEqual({ value: 'dairy-eggs', label: 'Dairy and eggs' })
  })
})

describe('findByName', () => {
  it('finds any ingredient, growable or not, built-in or your own, ignoring case, accents and spaces', () => {
    expect(findByName(catalogue, ' mushrooms ')?.id).toBe('mushroom')
    expect(findByName(catalogue, 'GRUYERE')?.id).toBe('gruyere')
    expect(findByName(catalogue, 'oca')?.id).toBe('my-oca-a1b2c')
    expect(findByName(catalogue, 'Mushroom')).toBeUndefined()
    expect(findByName(catalogue, '  ')).toBeUndefined()
  })
})

describe('findOrMakeIngredient', () => {
  it('reuses one already on the list rather than making a twin', () => {
    expect(findOrMakeIngredient(catalogue, { name: 'mushrooms', aisle: 'dry-goods', grows: true }, 0)).toEqual({
      ok: true,
      ingredient: INGREDIENTS[1],
      isNew: false,
    })
    expect(findOrMakeIngredient(catalogue, { name: 'Salt', aisle: 'veg', grows: false }, 0)).toMatchObject({
      ok: true,
      isNew: false,
      ingredient: { id: 'salt', assumed: true },
    })
  })

  it('still finds one that exists when the app is full of your own', () => {
    const result = findOrMakeIngredient(catalogue, { name: 'Oca', aisle: 'veg', grows: true }, LIMITS.myIngredients)
    expect(result).toMatchObject({ ok: true, isNew: false })
  })

  it('makes a new growable one with the seedling drawing', () => {
    expect(findOrMakeIngredient(catalogue, { name: ' Kohlrabi ', aisle: 'veg', grows: true }, 0)).toEqual({
      ok: true,
      isNew: true,
      ingredient: {
        id: expect.stringMatching(/^my-kohlrabi-[a-z0-9]{5}$/),
        name: 'Kohlrabi',
        aisle: 'veg',
        growable: true,
        art: 'seedling',
        harvestMonths: [],
      },
    })
  })

  it('makes a new one for the larder in the aisle given, with no drawing', () => {
    expect(findOrMakeIngredient(catalogue, { name: "Za'atar", aisle: 'spices', grows: false }, 3)).toEqual({
      ok: true,
      isNew: true,
      ingredient: { id: expect.stringMatching(/^my-zaatar-[a-z0-9]{5}$/), name: "Za'atar", aisle: 'spices', growable: false },
    })
  })

  it('says plainly why it cannot make one', () => {
    const make = (name: string, mine = 0) => findOrMakeIngredient(catalogue, { name, aisle: 'veg', grows: false }, mine)
    expect(make('  ')).toEqual({ ok: false, error: 'Give it a name.' })
    expect(make('x'.repeat(LIMITS.nameLength + 1))).toEqual({
      ok: false,
      error: `Keep the name to ${LIMITS.nameLength} characters or fewer.`,
    })
    expect(make('Yuzu', LIMITS.myIngredients)).toEqual({
      ok: false,
      error: "You've added as many of your own ingredients as the app can keep.",
    })
  })
})
