import { describe, expect, it } from 'vitest'
import { initialState, reducer, type Action } from './state'
import { deepFreeze, makeRecipe, makeState, ready, soon } from './test-fixtures'
import type { AppState, Ingredient, Recipe } from './types'

/** Runs the reducer on a deeply frozen state, so any mutation throws. */
const run = (state: AppState, action: Action) => reducer(deepFreeze(state), action)

describe('initialState', () => {
  it('is an empty version 1 state', () => {
    expect(initialState()).toEqual({
      version: 1,
      harvest: [],
      larder: [],
      plan: {},
      shoppingTicks: {},
      myRecipes: [],
      myIngredients: [],
    })
  })

  it('is a fresh object every time', () => {
    expect(initialState()).not.toBe(initialState())
  })
})

describe('harvest/add', () => {
  it('adds a crop to the end of the harvest, dated today', () => {
    const state = makeState({ harvest: [ready('tomato')] })
    const next = run(state, { type: 'harvest/add', ingredientId: 'kale', status: 'soon', glut: true, today: '2026-10-07' })
    expect(next.harvest).toEqual([ready('tomato'), { ingredientId: 'kale', status: 'soon', glut: true, addedOn: '2026-10-07' }])
  })

  it('updates status and glut of a crop already there instead of adding it twice, keeping its date', () => {
    const state = makeState({ harvest: [soon('kale')] })
    const next = run(state, { type: 'harvest/add', ingredientId: 'kale', status: 'ready', glut: true, today: '2026-10-07' })
    expect(next.harvest).toEqual([{ ...soon('kale'), status: 'ready', glut: true }])
  })

  it('returns the same state when the crop is already there exactly as asked', () => {
    const state = makeState({ harvest: [ready('kale')] })
    expect(run(state, { type: 'harvest/add', ingredientId: 'kale', status: 'ready', glut: false, today: '2026-10-07' })).toBe(state)
  })
})

describe('harvest/update', () => {
  it('changes only the fields given', () => {
    const state = makeState({ harvest: [soon('kale'), ready('tomato')] })
    expect(run(state, { type: 'harvest/update', ingredientId: 'kale', glut: true }).harvest).toEqual([
      soon('kale', true),
      ready('tomato'),
    ])
    expect(run(state, { type: 'harvest/update', ingredientId: 'kale', status: 'ready' }).harvest).toEqual([
      ready('kale'),
      ready('tomato'),
    ])
  })

  it('returns the same state for a crop that is not there, or a change that changes nothing', () => {
    const state = makeState({ harvest: [ready('kale')] })
    expect(run(state, { type: 'harvest/update', ingredientId: 'leek', glut: true })).toBe(state)
    expect(run(state, { type: 'harvest/update', ingredientId: 'kale', status: 'ready' })).toBe(state)
  })
})

describe('harvest/remove', () => {
  it('removes the crop', () => {
    const state = makeState({ harvest: [ready('kale'), ready('tomato')] })
    expect(run(state, { type: 'harvest/remove', ingredientId: 'kale' }).harvest).toEqual([ready('tomato')])
  })

  it('returns the same state when the crop is not there', () => {
    const state = makeState({ harvest: [ready('kale')] })
    expect(run(state, { type: 'harvest/remove', ingredientId: 'leek' })).toBe(state)
  })
})

describe('larder/add', () => {
  it('adds ingredients in the order given, skipping any already there or repeated', () => {
    const state = makeState({ larder: ['feta'] })
    expect(run(state, { type: 'larder/add', ingredientIds: ['egg', 'feta', 'basil', 'egg'] }).larder).toEqual([
      'feta',
      'egg',
      'basil',
    ])
  })

  it('returns the same state when everything is already there', () => {
    const state = makeState({ larder: ['feta', 'egg'] })
    expect(run(state, { type: 'larder/add', ingredientIds: ['egg', 'feta'] })).toBe(state)
    expect(run(state, { type: 'larder/add', ingredientIds: [] })).toBe(state)
  })
})

describe('larder/remove', () => {
  it('removes the ingredient', () => {
    const state = makeState({ larder: ['feta', 'egg'] })
    expect(run(state, { type: 'larder/remove', ingredientId: 'feta' }).larder).toEqual(['egg'])
  })

  it('returns the same state when it is not there', () => {
    const state = makeState({ larder: ['feta'] })
    expect(run(state, { type: 'larder/remove', ingredientId: 'egg' })).toBe(state)
  })
})

const meal = (id: string, recipeId = 'shakshuka', cooked = false) => ({ id, recipeId, cooked })
const MON = '2026-10-05'
const TUE = '2026-10-06'

describe('plan/add', () => {
  it('adds the meal to the end of that date', () => {
    const state = makeState({ plan: { [MON]: [meal('m1')] } })
    expect(run(state, { type: 'plan/add', date: MON, meal: meal('m2', 'tomato-salad') }).plan).toEqual({
      [MON]: [meal('m1'), meal('m2', 'tomato-salad')],
    })
    expect(run(state, { type: 'plan/add', date: TUE, meal: meal('m2') }).plan).toEqual({
      [MON]: [meal('m1')],
      [TUE]: [meal('m2')],
    })
  })

  it('returns the same state if a meal with that id is already on that date', () => {
    const state = makeState({ plan: { [MON]: [meal('m1')] } })
    expect(run(state, { type: 'plan/add', date: MON, meal: meal('m1', 'tomato-salad') })).toBe(state)
  })
})

describe('plan/remove', () => {
  it('removes the meal and leaves the rest of the day alone', () => {
    const state = makeState({ plan: { [MON]: [meal('m1'), meal('m2')] } })
    expect(run(state, { type: 'plan/remove', date: MON, mealId: 'm1' }).plan).toEqual({ [MON]: [meal('m2')] })
  })

  it('drops the date altogether rather than leaving an empty list', () => {
    const state = makeState({ plan: { [MON]: [meal('m1')], [TUE]: [meal('m2')] } })
    const next = run(state, { type: 'plan/remove', date: MON, mealId: 'm1' })
    expect(next.plan).toEqual({ [TUE]: [meal('m2')] })
    expect(next.plan).not.toHaveProperty(MON)
  })

  it('returns the same state when the meal is not there', () => {
    const state = makeState({ plan: { [MON]: [meal('m1')] } })
    expect(run(state, { type: 'plan/remove', date: MON, mealId: 'm9' })).toBe(state)
    expect(run(state, { type: 'plan/remove', date: TUE, mealId: 'm1' })).toBe(state)
  })
})

describe('plan/setCooked', () => {
  it('marks the meal cooked, or not cooked', () => {
    const state = makeState({ plan: { [MON]: [meal('m1'), meal('m2')] } })
    const cooked = run(state, { type: 'plan/setCooked', date: MON, mealId: 'm2', cooked: true })
    expect(cooked.plan).toEqual({ [MON]: [meal('m1'), meal('m2', 'shakshuka', true)] })
    expect(run(cooked, { type: 'plan/setCooked', date: MON, mealId: 'm2', cooked: false }).plan).toEqual(state.plan)
  })

  it('returns the same state when nothing changes or the meal is not there', () => {
    const state = makeState({ plan: { [MON]: [meal('m1', 'shakshuka', true)] } })
    expect(run(state, { type: 'plan/setCooked', date: MON, mealId: 'm1', cooked: true })).toBe(state)
    expect(run(state, { type: 'plan/setCooked', date: MON, mealId: 'm9', cooked: false })).toBe(state)
    expect(run(state, { type: 'plan/setCooked', date: TUE, mealId: 'm1', cooked: false })).toBe(state)
  })
})

describe('plan/fill', () => {
  it('adds one meal to each date given', () => {
    const state = makeState({ plan: { [MON]: [meal('m1')] } })
    const next = run(state, { type: 'plan/fill', meals: { [TUE]: meal('m2', 'tomato-salad'), '2026-10-07': meal('m3') } })
    expect(next.plan).toEqual({ [MON]: [meal('m1')], [TUE]: [meal('m2', 'tomato-salad')], '2026-10-07': [meal('m3')] })
  })

  it('returns the same state when there is nothing to add', () => {
    const state = makeState()
    expect(run(state, { type: 'plan/fill', meals: {} })).toBe(state)
  })
})

describe('shop/toggle', () => {
  it('ticks an item for that week, and unticks it again', () => {
    const state = makeState({ shoppingTicks: { [MON]: ['feta'] } })
    const ticked = run(state, { type: 'shop/toggle', weekStart: MON, ingredientId: 'egg' })
    expect(ticked.shoppingTicks).toEqual({ [MON]: ['feta', 'egg'] })
    expect(run(ticked, { type: 'shop/toggle', weekStart: MON, ingredientId: 'feta' }).shoppingTicks).toEqual({
      [MON]: ['egg'],
    })
  })

  it('keeps each week separate', () => {
    const state = makeState({ shoppingTicks: { [MON]: ['feta'] } })
    expect(run(state, { type: 'shop/toggle', weekStart: '2026-10-12', ingredientId: 'feta' }).shoppingTicks).toEqual({
      [MON]: ['feta'],
      '2026-10-12': ['feta'],
    })
  })

  it('drops the week altogether when its last tick is removed', () => {
    const state = makeState({ shoppingTicks: { [MON]: ['feta'] } })
    expect(run(state, { type: 'shop/toggle', weekStart: MON, ingredientId: 'feta' }).shoppingTicks).toEqual({})
  })
})

describe('shop/moveTickedToLarder', () => {
  it("puts that week's ticked items in the larder and clears those ticks", () => {
    const state = makeState({ larder: ['egg'], shoppingTicks: { [MON]: ['feta', 'egg'], '2026-10-12': ['basil'] } })
    const next = run(state, { type: 'shop/moveTickedToLarder', weekStart: MON })
    expect(next.larder).toEqual(['egg', 'feta'])
    expect(next.shoppingTicks).toEqual({ '2026-10-12': ['basil'] })
  })

  it('returns the same state when nothing is ticked that week', () => {
    const state = makeState({ shoppingTicks: { '2026-10-12': ['basil'] } })
    expect(run(state, { type: 'shop/moveTickedToLarder', weekStart: MON })).toBe(state)
  })
})

const chutney = makeRecipe('my-chutney-a1b2c', 'Courgette chutney', ['courgette', 'my-quince-x1y2z'], { course: 'preserve' })
const quince: Ingredient = { id: 'my-quince-x1y2z', name: 'Quince', aisle: 'fruit', growable: true, art: 'seedling' }

describe('myRecipes/save', () => {
  it('adds a new recipe of mine to the end', () => {
    const other = makeRecipe('my-pickle-d4e5f', 'Pickle', ['courgette'])
    const state = makeState({ myRecipes: [other] })
    expect(run(state, { type: 'myRecipes/save', recipe: chutney }).myRecipes).toEqual([other, chutney])
  })

  it('replaces a recipe with the same id where it stands', () => {
    const other = makeRecipe('my-pickle-d4e5f', 'Pickle', ['courgette'])
    const state = makeState({ myRecipes: [chutney, other] })
    const edited = { ...chutney, title: 'Spiced courgette chutney' }
    expect(run(state, { type: 'myRecipes/save', recipe: edited }).myRecipes).toEqual([edited, other])
  })

  it('returns the same state when saving the recipe exactly as stored', () => {
    const state = makeState({ myRecipes: [chutney] })
    expect(run(state, { type: 'myRecipes/save', recipe: state.myRecipes[0] as Recipe })).toBe(state)
  })
})

describe('myRecipes/remove (SPEC: deleting a recipe removes its planned meals)', () => {
  it('removes the recipe and every planned meal of it, dropping days left empty', () => {
    const state = makeState({
      myRecipes: [chutney],
      myIngredients: [quince],
      larder: ['my-quince-x1y2z'],
      plan: {
        [MON]: [meal('m1', chutney.id)],
        [TUE]: [meal('m2', 'shakshuka'), meal('m3', chutney.id, true)],
      },
    })
    const next = run(state, { type: 'myRecipes/remove', recipeId: chutney.id })
    expect(next.myRecipes).toEqual([])
    expect(next.plan).toEqual({ [TUE]: [meal('m2', 'shakshuka')] })
  })

  it('keeps my ingredients, which may be in the larder or other recipes', () => {
    const state = makeState({ myRecipes: [chutney], myIngredients: [quince], larder: ['my-quince-x1y2z'] })
    const next = run(state, { type: 'myRecipes/remove', recipeId: chutney.id })
    expect(next.myIngredients).toEqual([quince])
    expect(next.larder).toEqual(['my-quince-x1y2z'])
  })

  it('returns the same state when there is no such recipe of mine', () => {
    const state = makeState({ myRecipes: [chutney], plan: { [MON]: [meal('m1', 'shakshuka')] } })
    expect(run(state, { type: 'myRecipes/remove', recipeId: 'shakshuka' })).toBe(state)
  })
})

describe('myIngredients/add', () => {
  it('adds the ingredient', () => {
    expect(run(makeState(), { type: 'myIngredients/add', ingredient: quince }).myIngredients).toEqual([quince])
  })

  it('returns the same state if an ingredient with that id is already there', () => {
    const state = makeState({ myIngredients: [quince] })
    expect(run(state, { type: 'myIngredients/add', ingredient: { ...quince, name: 'Japanese quince' } })).toBe(state)
  })
})

describe('state/replace and state/reset', () => {
  it('replace swaps in the given state', () => {
    const replacement = makeState({ larder: ['feta'] })
    expect(run(makeState(), { type: 'state/replace', state: replacement })).toBe(replacement)
  })

  it('reset starts afresh', () => {
    expect(run(makeState({ larder: ['feta'], myRecipes: [chutney] }), { type: 'state/reset' })).toEqual(initialState())
  })

  it('reset returns the same state when it is already fresh', () => {
    const state = initialState()
    expect(run(state, { type: 'state/reset' })).toBe(state)
  })
})

describe('reducer: safety', () => {
  it('returns the same state for an action it does not know', () => {
    const state = makeState()
    expect(run(state, { type: 'garden/water' } as unknown as Action)).toBe(state)
  })

  const day = (count: number) => Array.from({ length: count }, (_, i) => meal(`m${i}`))

  it.each<[string, Action, Partial<AppState>?]>([
    ['a meal on a date that does not exist', { type: 'plan/add', date: '2026-02-30', meal: meal('m1') }],
    ['a fill with a date that is not a date', { type: 'plan/fill', meals: { [MON]: meal('m1'), someday: meal('m2') } }],
    ['a crop added on a non-date', { type: 'harvest/add', ingredientId: 'kale', status: 'ready', glut: false, today: 'today' }],
    ['an id over 64 characters', { type: 'larder/add', ingredientIds: ['x'.repeat(65)] }],
    ['ticks for a week that is not a date', { type: 'shop/toggle', weekStart: 'this-week', ingredientId: 'feta' }],
    ['a 21st meal on one day', { type: 'plan/add', date: MON, meal: meal('m20') }, { plan: { [MON]: day(20) } }],
    ['a recipe with an over-long title', { type: 'myRecipes/save', recipe: { ...chutney, title: 'x'.repeat(81) } }],
    ['a recipe without the my- prefix', { type: 'myRecipes/save', recipe: { ...chutney, id: 'chutney' } }],
    ['an ingredient without the my- prefix', { type: 'myIngredients/add', ingredient: { ...quince, id: 'quince' } }],
  ])('refuses %s, which would stop the state loading again', (_label, action, overrides = {}) => {
    const state = makeState(overrides)
    expect(run(state, action)).toBe(state)
  })

  it('never mutates the state it is given, whatever the action', () => {
    const state = deepFreeze(
      makeState({
        harvest: [ready('kale'), soon('tomato')],
        larder: ['feta'],
        plan: { [MON]: [meal('m1', chutney.id)], [TUE]: [meal('m2')] },
        shoppingTicks: { [MON]: ['egg'] },
        myRecipes: [chutney],
        myIngredients: [quince],
      }),
    )
    const snapshot = structuredClone(state)
    const actions: Action[] = [
      { type: 'harvest/add', ingredientId: 'leek', status: 'soon', glut: false, today: MON },
      { type: 'harvest/add', ingredientId: 'kale', status: 'soon', glut: true, today: MON },
      { type: 'harvest/update', ingredientId: 'tomato', status: 'ready' },
      { type: 'harvest/remove', ingredientId: 'kale' },
      { type: 'larder/add', ingredientIds: ['egg'] },
      { type: 'larder/remove', ingredientId: 'feta' },
      { type: 'plan/add', date: MON, meal: meal('m3') },
      { type: 'plan/remove', date: TUE, mealId: 'm2' },
      { type: 'plan/setCooked', date: MON, mealId: 'm1', cooked: true },
      { type: 'plan/fill', meals: { '2026-10-07': meal('m4') } },
      { type: 'shop/toggle', weekStart: MON, ingredientId: 'egg' },
      { type: 'shop/moveTickedToLarder', weekStart: MON },
      { type: 'myRecipes/save', recipe: { ...chutney, title: 'Edited' } },
      { type: 'myRecipes/remove', recipeId: chutney.id },
      { type: 'myIngredients/add', ingredient: { ...quince, id: 'my-medlar-q9w8e', name: 'Medlar' } },
      { type: 'state/reset' },
    ]
    for (const action of actions) {
      expect(reducer(state, action)).not.toBe(state)
    }
    expect(state).toEqual(snapshot)
  })
})
