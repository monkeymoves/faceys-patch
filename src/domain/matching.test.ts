import { describe, expect, it } from 'vitest'
import { buildCatalogue } from './catalogue'
import { matchRecipes } from './matching'
import { CATALOGUE, INGREDIENTS, deepFreeze, makeRecipe, ready, soon } from './test-fixtures'
import type { HarvestItem, IngredientId, RecipeMatch } from './types'

function match(harvest: readonly HarvestItem[], larder: readonly IngredientId[] = [], catalogue = CATALOGUE) {
  return matchRecipes({ catalogue, harvest, larder })
}

function matchFor(recipeId: string, harvest: readonly HarvestItem[], larder: readonly IngredientId[] = []) {
  const found = match(harvest, larder).find((result) => result.recipe.id === recipeId)
  if (!found) throw new Error(`${recipeId} was not matched`)
  return found
}

const ids = (matches: readonly RecipeMatch[]) => matches.map((result) => result.recipe.id)

describe('matchRecipes: fromPatch', () => {
  it('suggests only recipes that use something from the patch', () => {
    expect(ids(match([ready('courgette')])).sort()).toEqual(['courgette-fritters', 'courgette-soup'])
  })

  it('suggests nothing when the patch is empty, however full the larder', () => {
    expect(match([], ['feta', 'egg', 'smoked-paprika', 'tomato', 'potato'])).toEqual([])
  })

  it('counts optional ingredients from the patch too', () => {
    expect(ids(match([ready('basil')])).sort()).toEqual(['courgette-fritters', 'courgette-soup', 'tomato-salad'])
    expect(matchFor('courgette-fritters', [ready('basil')]).fromPatch).toEqual(['basil'])
  })

  it('counts patch items whatever their status, in recipe order', () => {
    expect(matchFor('patatas-bravas', [soon('tomato'), ready('potato')]).fromPatch).toEqual(['potato', 'tomato'])
  })
})

describe('matchRecipes: fromLarder', () => {
  it('lists larder ingredients, required or optional, in recipe order', () => {
    expect(matchFor('courgette-fritters', [ready('courgette')], ['basil', 'feta']).fromLarder).toEqual([
      'feta',
      'basil',
    ])
  })

  it('leaves out anything already counted from the patch', () => {
    expect(matchFor('courgette-fritters', [ready('courgette')], ['courgette', 'feta']).fromLarder).toEqual(['feta'])
  })
})

describe('matchRecipes: missing', () => {
  it('lists required ingredients you do not have, but never optional or assumed ones', () => {
    // Fritters: courgette, feta, egg, basil (optional), salt (assumed)
    expect(matchFor('courgette-fritters', [ready('courgette')]).missing).toEqual(['feta', 'egg'])
  })

  it('does not count anything in the patch or larder as missing', () => {
    expect(matchFor('patatas-bravas', [ready('potato'), soon('tomato')], ['smoked-paprika']).missing).toEqual([])
  })
})

describe('matchRecipes: readiness', () => {
  it('is ready when nothing is missing', () => {
    expect(matchFor('tomato-salad', [ready('tomato'), ready('basil')]).readiness).toBe('ready')
  })

  it('is nearly when one thing is missing', () => {
    expect(matchFor('spanish-omelette', [ready('potato')]).readiness).toBe('nearly')
  })

  it('is nearly when two things are missing', () => {
    expect(matchFor('courgette-fritters', [ready('courgette')]).readiness).toBe('nearly')
  })

  it('is shop when three or more things are missing', () => {
    expect(matchFor('courgette-fritters', [ready('basil')]).readiness).toBe('shop')
  })
})

describe('matchRecipes: ingredient ids missing from the catalogue', () => {
  const catalogue = buildCatalogue(INGREDIENTS, [makeRecipe('mystery-salad', 'Mystery salad', ['tomato', 'unicorn-horn'])])

  it('skips them entirely: never in fromPatch, fromLarder or missing, and never a crash', () => {
    const [result] = match([ready('tomato'), ready('unicorn-horn')], ['unicorn-horn'], catalogue)
    expect(result).toMatchObject({ fromPatch: ['tomato'], fromLarder: [], missing: [], readiness: 'ready' })
  })

  it('does not count a recipe as using the patch through an unknown id alone', () => {
    expect(match([ready('unicorn-horn')], [], catalogue)).toEqual([])
  })
})

describe('matchRecipes: score', () => {
  // Tomato salad: tomato, basil, salt (assumed). Basil from the larder, so nothing is missing.
  it('scores 3 for a ready patch item, plus 3 for being ready to cook', () => {
    expect(matchFor('tomato-salad', [ready('tomato')], ['basil']).score).toBe(6)
  })

  it('scores 1.5 for a patch item that is coming soon', () => {
    expect(matchFor('tomato-salad', [soon('tomato')], ['basil']).score).toBe(4.5)
  })

  it('doubles a glut', () => {
    expect(matchFor('tomato-salad', [ready('tomato', true)], ['basil']).score).toBe(9)
    expect(matchFor('tomato-salad', [soon('tomato', true)], ['basil']).score).toBe(6)
  })

  it('halves a patch item that is optional in the recipe', () => {
    // Fritters: courgette 3 + basil (optional) 1.5 + ready 3
    expect(matchFor('courgette-fritters', [ready('courgette'), ready('basil')], ['feta', 'egg']).score).toBe(7.5)
    // A glut of optional basil: 3 x 2 x 0.5 = 3
    expect(matchFor('courgette-fritters', [ready('courgette'), ready('basil', true)], ['feta', 'egg']).score).toBe(9)
  })

  it('takes off 2 per missing ingredient, with no ready bonus', () => {
    // Spanish omelette: potato 3, egg missing
    expect(matchFor('spanish-omelette', [ready('potato')]).score).toBe(1)
    // Fritters: courgette 3, feta and egg missing
    expect(matchFor('courgette-fritters', [ready('courgette')]).score).toBe(-1)
  })

  it('adds up every patch item', () => {
    // Courgette soup: courgette 3 + soon glut potato 3 + ready 3 (basil is optional, salt assumed)
    expect(matchFor('courgette-soup', [ready('courgette'), soon('potato', true)]).score).toBe(9)
  })

  it('ranks a recipe ready to cook above one that uses more of the patch but needs three things bought', () => {
    const catalogue = buildCatalogue(INGREDIENTS, [
      // Glut courgette 6 + tomato 3 - three missing (feta, egg, paprika) 6 = 3
      makeRecipe('ratatouille', 'Ratatouille', ['courgette', 'tomato', 'feta', 'egg', 'smoked-paprika']),
      // Soon potato 1.5 + ready 3 = 4.5
      makeRecipe('jacket-potato', 'Jacket potato', ['potato', 'salt']),
    ])
    const results = match([ready('courgette', true), ready('tomato'), soon('potato')], [], catalogue)
    expect(results.map((result) => [result.recipe.id, result.readiness, result.score])).toEqual([
      ['jacket-potato', 'ready', 4.5],
      ['ratatouille', 'shop', 3],
    ])
  })
})

describe('matchRecipes: order', () => {
  it('puts the highest score first, breaking ties by title A to Z', () => {
    // Soup 3 - 2 = 1, omelette 3 - 2 = 1, bravas 3 - 4 = -1
    expect(ids(match([ready('potato')]))).toEqual(['courgette-soup', 'spanish-omelette', 'patatas-bravas'])
  })

  it('falls back to recipe id when scores and titles tie, so input order never matters', () => {
    const twins = [makeRecipe('soup-b', 'Soup', ['tomato']), makeRecipe('soup-a', 'Soup', ['tomato'])]
    const forwards = buildCatalogue(INGREDIENTS, twins)
    const backwards = buildCatalogue(INGREDIENTS, [...twins].reverse())
    expect(ids(match([ready('tomato')], [], forwards))).toEqual(['soup-a', 'soup-b'])
    expect(ids(match([ready('tomato')], [], backwards))).toEqual(['soup-a', 'soup-b'])
  })

  it('gives the same answer every time and leaves its inputs alone', () => {
    const harvest = deepFreeze([ready('tomato'), soon('potato'), ready('courgette', true)])
    const larder = deepFreeze(['egg', 'feta'])
    const first = match(harvest, larder)
    expect(match(harvest, larder)).toEqual(first)
    expect(first.map((result) => [result.recipe.id, result.score])).toEqual([
      ['courgette-soup', 10.5], // glut courgette 6 + soon potato 1.5 + ready 3
      ['courgette-fritters', 9], // glut courgette 6 + ready 3
      ['spanish-omelette', 4.5], // soon potato 1.5 + ready 3
      ['patatas-bravas', 2.5], // soon potato 1.5 + tomato 3 - paprika 2
      ['shakshuka', 1], // tomato 3 - paprika 2, ties with the salad: S before T
      ['tomato-salad', 1], // tomato 3 - basil 2
    ])
  })
})
