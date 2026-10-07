import { describe, expect, it } from 'vitest'
import { buildCatalogue } from './catalogue'
import { buildShoppingList, shoppingListText } from './shopping'
import { CATALOGUE, INGREDIENTS, makeRecipe, ready } from './test-fixtures'
import type { HarvestItem, IngredientId, ISODate, MealPlan, ShoppingItem } from './types'

const WEEK_START = '2026-10-05' // Monday 5 to Sunday 11 October 2026
const MON = '2026-10-05'
const TUE = '2026-10-06'
const SUN = '2026-10-11'

let mealCount = 0
const meal = (recipeId: string, cooked = false) => ({ id: `meal-${++mealCount}`, recipeId, cooked })

interface Scenario {
  plan: MealPlan
  harvest?: readonly HarvestItem[]
  larder?: readonly IngredientId[]
  shoppingTicks?: Readonly<Record<ISODate, readonly IngredientId[]>>
  weekStart?: ISODate
}

function shop({ plan, harvest = [], larder = [], shoppingTicks = {}, weekStart = WEEK_START }: Scenario) {
  return buildShoppingList({ catalogue: CATALOGUE, harvest, larder, plan, shoppingTicks, weekStart })
}

const ids = (items: ReturnType<typeof shop>) => items.map((item) => item.ingredientId)

describe('buildShoppingList: what goes on the list', () => {
  it('lists each required ingredient you do not have, with its name and aisle', () => {
    // Fritters: courgette (patch), feta, egg (larder), basil (optional), salt (assumed)
    const items = shop({ plan: { [MON]: [meal('courgette-fritters')] }, harvest: [ready('courgette')], larder: ['egg'] })
    expect(items).toEqual([
      { ingredientId: 'feta', name: 'Feta', aisle: 'dairy-eggs', forRecipes: ['courgette-fritters'], ticked: false },
    ])
  })

  it('never lists optional or assumed ingredients', () => {
    // Shakshuka: tomato, egg, smoked paprika, feta (optional). Fritters need salt (assumed).
    const items = shop({ plan: { [MON]: [meal('shakshuka'), meal('courgette-fritters')] }, larder: ['tomato', 'egg', 'courgette'] })
    expect(ids(items)).toEqual(['feta', 'smoked-paprika'])
    expect(items.find((item) => item.ingredientId === 'feta')?.forRecipes).toEqual(['courgette-fritters'])
  })

  it('skips meals marked cooked', () => {
    const items = shop({ plan: { [MON]: [meal('spanish-omelette', true)], [TUE]: [meal('tomato-salad')] } })
    expect(ids(items)).toEqual(['tomato', 'basil'])
  })

  it('only looks at Monday to Sunday of the given week', () => {
    const items = shop({
      plan: {
        '2026-10-04': [meal('spanish-omelette')],
        [SUN]: [meal('tomato-salad')],
        '2026-10-12': [meal('courgette-fritters')],
      },
    })
    expect(ids(items)).toEqual(['tomato', 'basil'])
  })

  it('is empty when nothing is planned', () => {
    expect(shop({ plan: {} })).toEqual([])
  })
})

describe('buildShoppingList: merging and order', () => {
  it('merges an ingredient needed by several meals, naming each recipe once, in plan order', () => {
    // Monday: bravas then shakshuka. Tuesday: shakshuka again. All need tomatoes and paprika.
    const items = shop({
      plan: { [TUE]: [meal('shakshuka')], [MON]: [meal('patatas-bravas'), meal('shakshuka')] },
      larder: ['egg', 'potato'],
    })
    expect(items.map((item) => [item.ingredientId, item.forRecipes])).toEqual([
      ['tomato', ['patatas-bravas', 'shakshuka']],
      ['smoked-paprika', ['patatas-bravas', 'shakshuka']],
    ])
  })

  it('sorts by aisle (veg, fruit, herbs, dairy and eggs ... spices), then by name', () => {
    const items = shop({
      plan: {
        [MON]: [meal('courgette-fritters')],
        [TUE]: [meal('patatas-bravas')],
        [SUN]: [meal('tomato-salad')],
      },
    })
    expect(items.map((item) => item.name)).toEqual([
      'Courgettes',
      'Potatoes',
      'Tomatoes',
      'Basil',
      'Eggs',
      'Feta',
      'Smoked paprika',
    ])
  })
})

describe('buildShoppingList: ticks', () => {
  it('marks items ticked for this week only', () => {
    const items = shop({
      plan: { [MON]: [meal('tomato-salad')] },
      shoppingTicks: { [WEEK_START]: ['basil'], '2026-10-12': ['tomato'] },
    })
    expect(items.map((item) => [item.ingredientId, item.ticked])).toEqual([
      ['tomato', false],
      ['basil', true],
    ])
  })
})

describe('buildShoppingList: unknown ids', () => {
  it('skips planned meals whose recipe no longer exists', () => {
    expect(shop({ plan: { [MON]: [meal('deleted-recipe'), meal('tomato-salad')] } }).map((item) => item.ingredientId)).toEqual([
      'tomato',
      'basil',
    ])
  })

  it('skips recipe ingredients missing from the catalogue', () => {
    const catalogue = buildCatalogue(INGREDIENTS, [makeRecipe('mystery-salad', 'Mystery salad', ['tomato', 'unicorn-horn'])])
    const items = buildShoppingList({
      catalogue,
      harvest: [],
      larder: [],
      plan: { [MON]: [meal('mystery-salad')] },
      shoppingTicks: {},
      weekStart: WEEK_START,
    })
    expect(items.map((item) => item.ingredientId)).toEqual(['tomato'])
  })
})

describe('shoppingListText', () => {
  const item = (ingredientId: string, name: string, aisle: ShoppingItem['aisle'], ticked = false): ShoppingItem => ({
    ingredientId,
    name,
    aisle,
    forRecipes: ['shakshuka'],
    ticked,
  })

  it('writes plain text grouped under aisle headings, keeping the order given', () => {
    const text = shoppingListText(
      [item('feta', 'Feta', 'dairy-eggs'), item('egg', 'Eggs', 'dairy-eggs'), item('smoked-paprika', 'Smoked paprika', 'spices')],
      "Facey's Patch shopping, 6 to 12 October",
    )
    expect(text).toBe(
      [
        "Facey's Patch shopping, 6 to 12 October",
        '',
        'Dairy and eggs',
        '- Feta',
        '- Eggs',
        '',
        'Spices',
        '- Smoked paprika',
      ].join('\n'),
    )
  })

  it('leaves out ticked items, and any aisle with nothing left in it', () => {
    const text = shoppingListText(
      [item('tomato', 'Tomatoes', 'veg'), item('feta', 'Feta', 'dairy-eggs', true), item('tin', 'Chopped tomatoes', 'tins-jars')],
      'Shopping',
    )
    expect(text).toBe(['Shopping', '', 'Veg', '- Tomatoes', '', 'Tins and jars', '- Chopped tomatoes'].join('\n'))
  })

  it('is just the heading when everything is ticked', () => {
    expect(shoppingListText([item('feta', 'Feta', 'dairy-eggs', true)], 'Shopping')).toBe('Shopping')
  })
})
