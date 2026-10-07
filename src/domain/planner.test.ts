import { describe, expect, it } from 'vitest'
import { buildCatalogue } from './catalogue'
import { PLANNABLE_COURSES, planWeek } from './planner'
import { CATALOGUE, INGREDIENTS, deepFreeze, makeRecipe, ready, soon } from './test-fixtures'
import type { Catalogue, HarvestItem, IngredientId, ISODate, MealPlan } from './types'

// Monday 5 to Sunday 11 October 2026
const MON = '2026-10-05'
const TUE = '2026-10-06'
const WED = '2026-10-07'

interface Scenario {
  harvest: readonly HarvestItem[]
  larder?: readonly IngredientId[]
  plan?: MealPlan
  dates: readonly ISODate[]
  catalogue?: Catalogue
}

function plan({ harvest, larder = [], plan = {}, dates, catalogue = CATALOGUE }: Scenario) {
  return planWeek({ catalogue, harvest, larder, plan, dates })
}

describe('planWeek: candidates', () => {
  // Courgette in the patch, feta and eggs in the larder:
  // fritters 3 + ready 3 = 6, soup 3 - missing potato 2 = 1
  const courgetteWeek = { harvest: [ready('courgette')], larder: ['feta', 'egg'] }

  it('puts the best match on the date', () => {
    expect(plan({ ...courgetteWeek, dates: [MON] })).toEqual({ [MON]: 'courgette-fritters' })
  })

  it('never picks a recipe it has already chosen in this run', () => {
    expect(plan({ ...courgetteWeek, dates: [MON, TUE] })).toEqual({
      [MON]: 'courgette-fritters',
      [TUE]: 'courgette-soup',
    })
  })

  it('leaves the remaining dates empty when candidates run out', () => {
    expect(plan({ ...courgetteWeek, dates: [MON, TUE, WED] })).toEqual({
      [MON]: 'courgette-fritters',
      [TUE]: 'courgette-soup',
    })
  })

  it('plans nothing when nothing matches', () => {
    expect(plan({ harvest: [], larder: ['feta'], dates: [MON, TUE] })).toEqual({})
  })
})

const meal = (recipeId: string, id = `meal-${recipeId}`, cooked = false) => ({ id, recipeId, cooked })

describe('planWeek: dates', () => {
  const courgetteWeek = { harvest: [ready('courgette')], larder: ['feta', 'egg'] }

  it('fills dates in date order, whatever order they are given in, ignoring duplicates', () => {
    expect(plan({ ...courgetteWeek, dates: [TUE, MON, TUE] })).toEqual({
      [MON]: 'courgette-fritters',
      [TUE]: 'courgette-soup',
    })
  })

  it('never touches a date that already holds a meal', () => {
    const result = plan({ ...courgetteWeek, plan: { [MON]: [meal('tomato-salad')] }, dates: [MON, TUE] })
    expect(result).toEqual({ [TUE]: 'courgette-fritters' })
  })

  it('treats a date with an empty list of meals as empty', () => {
    expect(plan({ ...courgetteWeek, plan: { [MON]: [] }, dates: [MON] })).toEqual({ [MON]: 'courgette-fritters' })
  })

  it('ignores anything in dates that is not a calendar date', () => {
    expect(plan({ ...courgetteWeek, dates: ['2026-02-30', 'soon', MON] })).toEqual({ [MON]: 'courgette-fritters' })
  })
})

describe('planWeek: no repeats in a week', () => {
  const courgetteWeek = { harvest: [ready('courgette')], larder: ['feta', 'egg'] }

  it('skips a recipe already planned elsewhere in that week, cooked or not', () => {
    const result = plan({ ...courgetteWeek, plan: { [WED]: [meal('courgette-fritters', 'm1', true)] }, dates: [MON] })
    expect(result).toEqual({ [MON]: 'courgette-soup' })
  })

  it('can pick a recipe that is planned in a different week', () => {
    const result = plan({ ...courgetteWeek, plan: { '2026-09-28': [meal('courgette-fritters')] }, dates: [MON] })
    expect(result).toEqual({ [MON]: 'courgette-fritters' })
  })

  it('checks each date against its own week, and against everything chosen earlier in the run', () => {
    // Saturday 10 has fritters. Sunday 11 is the same week, so it gets soup.
    // Monday 12 starts a new week, so fritters are allowed again; soup was chosen earlier in the run.
    const result = plan({
      ...courgetteWeek,
      plan: { '2026-10-10': [meal('courgette-fritters')] },
      dates: ['2026-10-11', '2026-10-12'],
    })
    expect(result).toEqual({ '2026-10-11': 'courgette-soup', '2026-10-12': 'courgette-fritters' })
  })

  it('shrugs off planned meals whose recipe no longer exists', () => {
    expect(plan({ ...courgetteWeek, plan: { [WED]: [meal('deleted-recipe')] }, dates: [MON] })).toEqual({
      [MON]: 'courgette-fritters',
    })
  })
})

describe('planWeek: variety', () => {
  const week = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
  const fullLarder = ['feta', 'egg', 'basil', 'potato', 'smoked-paprika']

  it('halves a patch ingredient once it has been used this week, spreading the patch across the week', () => {
    // Courgette and tomato ready, everything else in the larder: the four plannable
    // recipes (the salad is not a dinner) all start at 6.
    // Mon fritters (courgette). Tue: soup's courgette now counts 1.5, so bravas (tomato, 6).
    // Wed: soup and shakshuka both 4.5; soup wins on title. Thu: shakshuka. Then nothing is left.
    const result = plan({ harvest: [ready('courgette'), ready('tomato')], larder: fullLarder, dates: week })
    expect(result).toEqual({
      '2026-10-05': 'courgette-fritters',
      '2026-10-06': 'patatas-bravas',
      '2026-10-07': 'courgette-soup',
      '2026-10-08': 'shakshuka',
    })
  })

  // Four courgette-only recipes and one with optional tomato, to watch the halving play out.
  const courgetteCatalogue = buildCatalogue(INGREDIENTS, [
    makeRecipe('alpha', 'Alpha', ['courgette']),
    makeRecipe('bravo', 'Bravo', ['courgette']),
    makeRecipe('charlie', 'Charlie', ['courgette']),
    makeRecipe('delta', 'Delta', [{ id: 'tomato', optional: true }]),
    makeRecipe('echo', 'Echo', ['courgette']),
  ])

  it('halves again for each further use', () => {
    // Courgette recipes 3 + 3 = 6, delta 1.5 + 3 = 4.5.
    // Mon alpha. Tue: courgette halved, 4.5 all round, bravo on title.
    // Wed: courgette quartered (0.75 + 3 = 3.75), so delta (4.5) wins. Thu: charlie.
    const result = plan({
      catalogue: courgetteCatalogue,
      harvest: [ready('courgette'), ready('tomato')],
      dates: week.slice(0, 4),
    })
    expect(result).toEqual({
      '2026-10-05': 'alpha',
      '2026-10-06': 'bravo',
      '2026-10-07': 'delta',
      '2026-10-08': 'charlie',
    })
  })

  it('gives a glut its first two uses free, then halves', () => {
    // Glut courgette recipes 6 + 3 = 9, delta (glut tomato, optional) 3 + 3 = 6.
    // Mon alpha, Tue bravo, Wed charlie, all at 9. Thu: courgette's third use halves it,
    // so echo is 3 + 3 = 6, level with delta, which wins on title. Fri: echo.
    const result = plan({
      catalogue: courgetteCatalogue,
      harvest: [ready('courgette', true), ready('tomato', true)],
      dates: week.slice(0, 5),
    })
    expect(result).toEqual({
      '2026-10-05': 'alpha',
      '2026-10-06': 'bravo',
      '2026-10-07': 'charlie',
      '2026-10-08': 'delta',
      '2026-10-09': 'echo',
    })
  })

  it('counts uses by meals already planned that week, cooked or not', () => {
    // Fritters (courgette) are already on Monday, so soup's courgette counts 1.5 on Tuesday
    // and bravas (tomato, 6) wins. Without counting Monday, soup would win on title.
    const result = plan({
      harvest: [ready('courgette'), ready('tomato')],
      larder: fullLarder,
      plan: { [MON]: [meal('courgette-fritters', 'm1', true)] },
      dates: [TUE],
    })
    expect(result).toEqual({ [TUE]: 'patatas-bravas' })
  })

  it('only counts uses within the same week', () => {
    // Fritters last Sunday neither block nor dent this week's courgettes: fritters win on title as usual.
    const result = plan({
      harvest: [ready('courgette'), ready('tomato')],
      larder: fullLarder,
      plan: { '2026-10-04': [meal('courgette-fritters')] },
      dates: [MON],
    })
    expect(result).toEqual({ [MON]: 'courgette-fritters' })
  })
})

describe('planWeek: soon items', () => {
  const fullLarder = ['feta', 'egg', 'basil', 'courgette', 'smoked-paprika']
  // Glut tomatoes coming soon, potatoes ready now:
  // bravas 3 + 3 + 3 = 9 (soon), shakshuka 3 + 3 = 6 (soon),
  // omelette and soup 3 + 3 = 6 (no soon items). The salad is never planned.
  const soonTomatoes = { harvest: [soon('tomato', true), ready('potato')], larder: fullLarder }

  it('keeps recipes using soon items off the first two dates of the run while anything else is left', () => {
    // Mon: soup (title beats omelette). Tue: omelette (potato halved, 1.5 + 3).
    // Wed: bravas at last (0.75 + 3 + 3). Thu: shakshuka (glut tomato's second use is free).
    const result = plan({ ...soonTomatoes, dates: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'] })
    expect(result).toEqual({
      '2026-10-05': 'courgette-soup',
      '2026-10-06': 'spanish-omelette',
      '2026-10-07': 'patatas-bravas',
      '2026-10-08': 'shakshuka',
    })
  })

  it('uses a soon item on an early date if nothing else is left', () => {
    // Every plannable candidate uses the soon tomatoes. Shakshuka 1.5 + 3 = 4.5,
    // bravas 1.5 - 2 (no potatoes) = -0.5.
    const result = plan({ harvest: [soon('tomato')], larder: fullLarder, dates: [MON] })
    expect(result).toEqual({ [MON]: 'shakshuka' })
  })

  it('counts the first two dates given, even if one of them already holds a meal', () => {
    // Monday is already planned, so Tuesday is the second date of the run: soup.
    // Wednesday is the third, so bravas can go there (potato used once: 1.5 + 3 + 3 = 7.5).
    const result = plan({
      ...soonTomatoes,
      plan: { [MON]: [meal('courgette-fritters')] },
      dates: [MON, TUE, WED],
    })
    expect(result).toEqual({ [TUE]: 'courgette-soup', [WED]: 'patatas-bravas' })
  })
})

describe('planWeek: determinism', () => {
  it('gives the same plan for the same input, without touching its inputs', () => {
    const input = deepFreeze({
      catalogue: CATALOGUE,
      harvest: [ready('courgette', true), soon('tomato'), ready('potato')],
      larder: ['egg', 'feta'],
      plan: { [WED]: [meal('shakshuka')] },
      dates: [MON, TUE, WED, '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
    })
    const first = planWeek(input)
    expect(planWeek(input)).toEqual(first)
    expect(Object.keys(first).length).toBeGreaterThan(0)
  })
})

describe('planWeek: only dinners', () => {
  it('plans mains and soups only', () => {
    expect(PLANNABLE_COURSES).toEqual(['main', 'soup'])
  })

  it('never puts a pudding, preserve, bake, salad or side on the plan, however well it matches', () => {
    // Every recipe uses the glut courgettes and nothing else, so all score the same
    // and would otherwise be picked in title order.
    const catalogue = buildCatalogue(INGREDIENTS, [
      makeRecipe('cake', 'A courgette cake', ['courgette'], { course: 'pudding' }),
      makeRecipe('chutney', 'B courgette chutney', ['courgette'], { course: 'preserve' }),
      makeRecipe('loaf', 'C courgette loaf', ['courgette'], { course: 'bake' }),
      makeRecipe('ribbons', 'D courgette ribbons', ['courgette'], { course: 'salad' }),
      makeRecipe('fries', 'E courgette fries', ['courgette'], { course: 'side' }),
      makeRecipe('soup', 'F courgette soup', ['courgette'], { course: 'soup' }),
      makeRecipe('gratin', 'G courgette gratin', ['courgette'], { course: 'main' }),
    ])
    const result = plan({ catalogue, harvest: [ready('courgette', true)], dates: [MON, TUE, WED] })
    expect(result).toEqual({ [MON]: 'soup', [TUE]: 'gratin' })
  })
})
