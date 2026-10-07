import { describe, expect, it } from 'vitest'
import { appStateSchema } from './schema'
import { makeRecipe, makeState, ready } from './test-fixtures'
import type { Ingredient, Recipe } from './types'

const valid = (value: unknown) => appStateSchema.safeParse(value).success
const repeat = <T>(count: number, make: (index: number) => T): T[] => Array.from({ length: count }, (_, i) => make(i))

const myRecipe = (overrides: Partial<Recipe> = {}): Recipe =>
  makeRecipe('my-courgette-chutney-a1b2c', 'Courgette chutney', ['courgette', { id: 'basil', optional: true }], {
    course: 'preserve',
    ...overrides,
  })

const myIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: 'my-quince-x1y2z',
  name: 'Quince',
  aisle: 'fruit',
  growable: true,
  art: 'seedling',
  harvestMonths: [10, 11],
  ...overrides,
})

const fullState = makeState({
  harvest: [ready('courgette'), { ingredientId: 'tomato', status: 'soon', glut: true, addedOn: '2026-09-30' }],
  larder: ['feta', 'egg', 'my-quince-x1y2z'],
  plan: {
    '2026-10-05': [{ id: 'meal-1', recipeId: 'shakshuka', cooked: true }],
    '2026-10-06': [],
  },
  shoppingTicks: { '2026-10-05': ['smoked-paprika'] },
  myRecipes: [myRecipe()],
  myIngredients: [myIngredient()],
})

describe('appStateSchema: what it accepts', () => {
  it('accepts a fresh state', () => {
    expect(valid(makeState())).toBe(true)
  })

  it('accepts a full state and returns it unchanged', () => {
    expect(appStateSchema.parse(fullState)).toEqual(fullState)
  })

  it('strips unknown keys at any depth', () => {
    const parsed = appStateSchema.parse({
      ...fullState,
      theme: 'dark',
      harvest: [{ ...ready('courgette'), colour: 'green' }],
    })
    expect(parsed).not.toHaveProperty('theme')
    expect(parsed.harvest[0]).not.toHaveProperty('colour')
  })

  it('fills in empty lists for saved state from before my recipes and ingredients existed', () => {
    const { myRecipes: _r, myIngredients: _i, ...older } = fullState
    const parsed = appStateSchema.parse(older)
    expect(parsed.myRecipes).toEqual([])
    expect(parsed.myIngredients).toEqual([])
  })
})

describe('appStateSchema: what it rejects', () => {
  it.each([
    ['a different version', { ...fullState, version: 2 }],
    ['a missing harvest', { ...fullState, harvest: undefined }],
    ['an unknown harvest status', { ...fullState, harvest: [{ ...ready('kale'), status: 'rotten' }] }],
    ['an impossible addedOn date', { ...fullState, harvest: [{ ...ready('kale'), addedOn: '2026-02-30' }] }],
    ['the same crop twice in the harvest', { ...fullState, harvest: [ready('kale'), ready('kale')] }],
    ['the same ingredient twice in the larder', { ...fullState, larder: ['feta', 'feta'] }],
    ['an empty id', { ...fullState, larder: [''] }],
    ['an id over 64 characters', { ...fullState, larder: ['x'.repeat(65)] }],
    ['a larder of over 500 items', { ...fullState, larder: repeat(501, (i) => `item-${i}`) }],
    ['a plan keyed by something other than a date', { ...fullState, plan: { tomorrow: [] } }],
    ['a plan date that does not exist', { ...fullState, plan: { '2026-02-30': [] } }],
    ['a planned meal without a recipe', { ...fullState, plan: { '2026-10-05': [{ id: 'm1', cooked: false }] } }],
    [
      'over 20 meals on one day',
      { ...fullState, plan: { '2026-10-05': repeat(21, (i) => ({ id: `m${i}`, recipeId: 'shakshuka', cooked: false })) } },
    ],
    ['shopping ticks keyed by something other than a date', { ...fullState, shoppingTicks: { 'week-1': ['feta'] } }],
    ['a string where a list belongs', { ...fullState, larder: 'feta' }],
    ['not an object at all', 'faceys-patch'],
  ])('rejects %s', (_label, value) => {
    expect(valid(value)).toBe(false)
  })

  it('accepts an id of exactly 64 characters', () => {
    expect(valid({ ...fullState, larder: ['x'.repeat(64)] })).toBe(true)
  })
})

describe('appStateSchema: my recipes (SPEC: storage caps)', () => {
  const withRecipe = (overrides: Partial<Recipe>) => ({ ...fullState, myRecipes: [myRecipe(overrides)] })

  it.each([
    ['a title of 80 characters', { title: 'x'.repeat(80) }],
    ['an empty blurb', { blurb: '' }],
    ['a blurb of 200 characters', { blurb: 'x'.repeat(200) }],
    ['30 steps of 600 characters', { steps: repeat(30, () => 'x'.repeat(600)) }],
    ['30 ingredients', { ingredients: repeat(30, (i) => ({ id: `item-${i}`, amount: 'x'.repeat(40), prep: 'x'.repeat(40) })) }],
    ['no diet at all (meat or fish)', { diet: [] }],
  ])('accepts %s', (_label, overrides) => {
    expect(valid(withRecipe(overrides))).toBe(true)
  })

  it.each([
    ['an id without the my- prefix', { id: 'courgette-chutney' }],
    ['an empty title', { title: '' }],
    ['a blank title', { title: '   ' }],
    ['a title over 80 characters', { title: 'x'.repeat(81) }],
    ['a blurb over 200 characters', { blurb: 'x'.repeat(201) }],
    ['a step over 600 characters', { steps: ['x'.repeat(601)] }],
    ['over 30 steps', { steps: repeat(31, () => 'Stir.') }],
    ['over 30 ingredients', { ingredients: repeat(31, (i) => ({ id: `item-${i}`, amount: '1' })) }],
    ['an amount over 40 characters', { ingredients: [{ id: 'courgette', amount: 'x'.repeat(41) }] }],
    ['prep over 40 characters', { ingredients: [{ id: 'courgette', amount: '1', prep: 'x'.repeat(41) }] }],
    ['an unknown course', { course: 'starter' as Recipe['course'] }],
    ['an unknown diet', { diet: ['pescatarian' as Recipe['diet'][number]] }],
    ['fractional minutes', { minutes: 2.5 }],
    ['negative minutes', { minutes: -1 }],
    ['nobody to serve', { serves: 0 }],
  ])('rejects %s', (_label, overrides) => {
    expect(valid(withRecipe(overrides))).toBe(false)
  })

  it('accepts 300 recipes but not 301', () => {
    const recipes = (count: number) => repeat(count, (i) => myRecipe({ id: `my-recipe-${i}` }))
    expect(valid({ ...fullState, myRecipes: recipes(300) })).toBe(true)
    expect(valid({ ...fullState, myRecipes: recipes(301) })).toBe(false)
  })

  it('rejects two recipes with the same id', () => {
    expect(valid({ ...fullState, myRecipes: [myRecipe(), myRecipe()] })).toBe(false)
  })
})

describe('appStateSchema: my ingredients (SPEC: storage caps)', () => {
  const withIngredient = (overrides: Partial<Ingredient>) => ({ ...fullState, myIngredients: [myIngredient(overrides)] })

  it.each([
    ['a shop-bought ingredient with no art or months', { growable: false, art: undefined, harvestMonths: undefined }],
    ['a growable ingredient with no harvest months', { harvestMonths: [] }],
    ['an assumed ingredient', { growable: false, art: undefined, assumed: true }],
  ])('accepts %s', (_label, overrides) => {
    expect(valid(withIngredient(overrides))).toBe(true)
  })

  it.each([
    ['an id without the my- prefix', { id: 'quince' }],
    ['an empty name', { name: '' }],
    ['a name over 80 characters', { name: 'x'.repeat(81) }],
    ['an unknown aisle', { aisle: 'freezer' as Ingredient['aisle'] }],
    ['an unknown drawing', { art: 'quince' as Ingredient['art'] }],
    ['a growable ingredient with no drawing', { art: undefined }],
    ['month 13', { harvestMonths: [13] }],
    ['month 0', { harvestMonths: [0] }],
    ['a fractional month', { harvestMonths: [6.5] }],
  ])('rejects %s', (_label, overrides) => {
    expect(valid(withIngredient(overrides))).toBe(false)
  })

  it('accepts 300 ingredients but not 301', () => {
    const ingredients = (count: number) => repeat(count, (i) => myIngredient({ id: `my-item-${i}` }))
    expect(valid({ ...fullState, myIngredients: ingredients(300) })).toBe(true)
    expect(valid({ ...fullState, myIngredients: ingredients(301) })).toBe(false)
  })

  it('rejects two ingredients with the same id', () => {
    expect(valid({ ...fullState, myIngredients: [myIngredient(), myIngredient()] })).toBe(false)
  })
})
