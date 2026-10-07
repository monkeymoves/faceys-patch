import { describe, expect, it } from 'vitest'
import { buildCatalogue, type Ingredient, type Recipe } from '../../domain'
import { groupIngredients, missingNames, patchDrawings, upcomingDays } from './recipeParts'

const INGREDIENTS: Ingredient[] = [
  { id: 'courgette', name: 'Courgettes', aisle: 'veg', growable: true, art: 'courgette', harvestMonths: [7] },
  { id: 'onion', name: 'Onions', aisle: 'veg', growable: true, art: 'onion', harvestMonths: [7] },
  { id: 'lemon', name: 'Lemons', aisle: 'fruit', growable: false },
  { id: 'feta', name: 'Feta', aisle: 'dairy-eggs', growable: false },
  { id: 'salt', name: 'Salt', aisle: 'spices', growable: false, assumed: true },
]

const RECIPE: Recipe = {
  id: 'courgette-salad',
  title: 'Courgette salad',
  blurb: '',
  minutes: 10,
  serves: 2,
  course: 'salad',
  diet: ['vegetarian'],
  ingredients: [
    { id: 'salt', amount: 'a pinch' },
    { id: 'courgette', amount: '2', prep: 'shaved' },
    { id: 'lemon', amount: '1' },
    { id: 'gone', amount: '1' },
    { id: 'onion', amount: '1' },
    { id: 'feta', amount: '50g', optional: true },
  ],
  steps: ['Toss it all together.'],
}

const catalogue = buildCatalogue(INGREDIENTS, [RECIPE])
const names = (lines: { ingredient: Ingredient }[]) => lines.map((line) => line.ingredient.name)

describe('groupIngredients', () => {
  it('splits by patch, larder (assumed last) and to buy, skipping unknown ids', () => {
    const groups = groupIngredients(RECIPE, {
      catalogue,
      harvest: [{ ingredientId: 'courgette', status: 'soon', glut: false, addedOn: '2026-10-01' }],
      larder: ['onion'],
    })
    expect(names(groups.patch)).toEqual(['Courgettes'])
    expect(names(groups.larder)).toEqual(['Onions', 'Salt'])
    expect(names(groups.buy)).toEqual(['Lemons', 'Feta'])
    expect(groups.patch[0]?.amount).toBe('2, shaved')
    expect(groups.buy[1]?.optional).toBe(true)
  })
})

describe('card helpers', () => {
  it('gives drawings and lower-cased names', () => {
    expect(patchDrawings(['courgette', 'gone'], catalogue)).toEqual([{ art: 'courgette', name: 'courgettes' }])
    expect(missingNames(['lemon', 'feta'], catalogue)).toEqual(['lemons', 'feta'])
  })
})

describe('upcomingDays', () => {
  it('gives today and the next 13 days, grouped by calendar week', () => {
    const groups = upcomingDays(
      '2026-10-07',
      { '2026-10-09': [{ id: 'm1', recipeId: 'courgette-salad', cooked: false }] },
      catalogue,
    )
    expect(groups.map((group) => [group.label, group.days.length])).toEqual([
      ['This week', 5],
      ['Next week', 7],
      ['The week after', 2],
    ])
    expect(groups[0]?.days[0]).toEqual({ date: '2026-10-07', today: true, planned: [] })
    expect(groups[0]?.days[2]?.planned).toEqual(['Courgette salad'])
    expect(groups[2]?.days.at(-1)?.date).toBe('2026-10-20')
  })

  it('makes exactly two weeks when today is a Monday', () => {
    const groups = upcomingDays('2026-10-05', {}, catalogue)
    expect(groups.map((group) => group.days.length)).toEqual([7, 7])
  })
})
