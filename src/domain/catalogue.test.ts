import { describe, expect, it } from 'vitest'
import { buildCatalogue, deriveDiet, findRecipe, hasIngredient, withMyContent } from './catalogue'
import { CATALOGUE, INGREDIENTS, RECIPES, makeRecipe, ready, soon } from './test-fixtures'
import type { Ingredient } from './types'

describe('buildCatalogue', () => {
  it('looks ingredients up by id and keeps recipes in the order given', () => {
    const catalogue = buildCatalogue(INGREDIENTS, RECIPES)
    expect(catalogue.ingredients.get('feta')?.name).toBe('Feta')
    expect(catalogue.ingredients.size).toBe(INGREDIENTS.length)
    expect(catalogue.recipes.map((recipe) => recipe.id)).toEqual(RECIPES.map((recipe) => recipe.id))
  })
})

describe('findRecipe', () => {
  it('finds a recipe by id', () => {
    expect(findRecipe(CATALOGUE, 'shakshuka')?.title).toBe('Shakshuka')
  })

  it('returns undefined for an unknown id', () => {
    expect(findRecipe(CATALOGUE, 'deleted-recipe')).toBeUndefined()
  })
})

describe('hasIngredient (SPEC: Having an ingredient)', () => {
  const supplies = { catalogue: CATALOGUE, harvest: [ready('courgette'), soon('tomato')], larder: ['feta'] }

  it('you have anything in the harvest that is ready', () => {
    expect(hasIngredient('courgette', supplies)).toBe(true)
  })

  it('you have anything in the harvest that is coming soon', () => {
    expect(hasIngredient('tomato', supplies)).toBe(true)
  })

  it('you have anything in the larder', () => {
    expect(hasIngredient('feta', supplies)).toBe(true)
  })

  it('you always have assumed ingredients', () => {
    expect(hasIngredient('salt', supplies)).toBe(true)
  })

  it('you do not have a known ingredient that is nowhere', () => {
    expect(hasIngredient('egg', supplies)).toBe(false)
  })

  it('an id missing from the catalogue is simply not had, even if stored in the larder', () => {
    expect(hasIngredient('dragon-fruit', { ...supplies, larder: ['dragon-fruit'] })).toBe(false)
  })
})

describe('withMyContent (SPEC: My recipes and ingredients)', () => {
  const myChutney = makeRecipe('my-courgette-chutney-a1b2c', 'Courgette chutney', ['courgette', 'my-quince'], {
    course: 'preserve',
  })
  const myQuince: Ingredient = { id: 'my-quince', name: 'Quince', aisle: 'fruit', growable: true, art: 'seedling' }

  it('adds my ingredients to the lookup and my recipes after the built-in ones', () => {
    const merged = withMyContent(CATALOGUE, { myRecipes: [myChutney], myIngredients: [myQuince] })
    expect(merged.ingredients.get('my-quince')).toEqual(myQuince)
    expect(merged.ingredients.get('feta')?.name).toBe('Feta')
    expect(merged.recipes.map((recipe) => recipe.id)).toEqual([...RECIPES.map((recipe) => recipe.id), myChutney.id])
  })

  it('keeps the built-in ingredient or recipe when an id clashes', () => {
    const fakeFeta: Ingredient = { id: 'feta', name: 'Not feta', aisle: 'veg', growable: false }
    const fakeSalad = makeRecipe('tomato-salad', 'Impostor salad', ['tomato'])
    const merged = withMyContent(CATALOGUE, { myRecipes: [fakeSalad], myIngredients: [fakeFeta] })
    expect(merged.ingredients.get('feta')?.name).toBe('Feta')
    expect(merged.recipes.filter((recipe) => recipe.id === 'tomato-salad')).toEqual([findRecipe(CATALOGUE, 'tomato-salad')])
  })

  it('leaves the built-in catalogue untouched', () => {
    withMyContent(CATALOGUE, { myRecipes: [myChutney], myIngredients: [myQuince] })
    expect(CATALOGUE.ingredients.has('my-quince')).toBe(false)
    expect(CATALOGUE.recipes).toHaveLength(RECIPES.length)
  })

  it('returns the built-in catalogue itself when you have written nothing, so memoised views stay put', () => {
    expect(withMyContent(CATALOGUE, { myRecipes: [], myIngredients: [] })).toBe(CATALOGUE)
  })
})

describe('deriveDiet (SPEC: diet is derived on save)', () => {
  const catalogue = buildCatalogue(
    [
      ...INGREDIENTS,
      { id: 'bacon', name: 'Bacon', aisle: 'meat-fish', growable: false },
      { id: 'honey', name: 'Honey', aisle: 'oils-sauces', growable: false },
    ],
    RECIPES,
  )

  it('is vegan and vegetarian with no meat, fish, dairy, eggs or honey', () => {
    expect(deriveDiet(['tomato', 'basil', 'salt'], catalogue)).toEqual(['vegan', 'vegetarian'])
  })

  it('is only vegetarian with dairy or eggs', () => {
    expect(deriveDiet(['courgette', 'feta'], catalogue)).toEqual(['vegetarian'])
    expect(deriveDiet(['potato', 'egg'], catalogue)).toEqual(['vegetarian'])
  })

  it('is only vegetarian with honey', () => {
    expect(deriveDiet(['tomato', 'honey'], catalogue)).toEqual(['vegetarian'])
  })

  it('is neither with any meat or fish', () => {
    expect(deriveDiet(['potato', 'bacon'], catalogue)).toEqual([])
  })

  it('ignores ids missing from the catalogue', () => {
    expect(deriveDiet(['tomato', 'mystery-meat'], catalogue)).toEqual(['vegan', 'vegetarian'])
  })

  it('reads my own ingredients through the merged catalogue', () => {
    const merged = withMyContent(catalogue, {
      myRecipes: [],
      myIngredients: [{ id: 'my-pancetta', name: 'Pancetta', aisle: 'meat-fish', growable: false }],
    })
    expect(deriveDiet(['tomato', 'my-pancetta'], merged)).toEqual([])
  })
})
