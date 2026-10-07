/**
 * A small hand-written catalogue for domain tests. Never import src/data here:
 * tests must not change meaning when the real recipes are edited.
 */
import { buildCatalogue } from './catalogue'
import type {
  AppState,
  HarvestItem,
  Ingredient,
  IngredientId,
  Recipe,
  RecipeIngredient,
} from './types'

export const INGREDIENTS: readonly Ingredient[] = [
  {
    id: 'courgette',
    name: 'Courgettes',
    aisle: 'veg',
    growable: true,
    art: 'courgette',
    harvestMonths: [6, 7, 8, 9],
  },
  {
    id: 'tomato',
    name: 'Tomatoes',
    aisle: 'veg',
    growable: true,
    art: 'tomato',
    harvestMonths: [7, 8, 9],
  },
  {
    id: 'potato',
    name: 'Potatoes',
    aisle: 'veg',
    growable: true,
    art: 'potato',
    harvestMonths: [6, 7, 8, 9, 10],
  },
  {
    id: 'basil',
    name: 'Basil',
    aisle: 'herbs',
    growable: true,
    art: 'herb-soft',
    harvestMonths: [6, 7, 8, 9],
  },
  { id: 'feta', name: 'Feta', aisle: 'dairy-eggs', growable: false },
  { id: 'egg', name: 'Eggs', aisle: 'dairy-eggs', growable: false },
  { id: 'smoked-paprika', name: 'Smoked paprika', aisle: 'spices', growable: false },
  { id: 'salt', name: 'Salt', aisle: 'spices', growable: false, assumed: true },
]

type IngredientSpec = IngredientId | { id: IngredientId; optional: true }

const toRecipeIngredient = (spec: IngredientSpec): RecipeIngredient =>
  typeof spec === 'string'
    ? { id: spec, amount: 'some' }
    : { id: spec.id, amount: 'a little', optional: true }

/** A recipe with sensible defaults. Optional ingredients are written `{ id, optional: true }`. */
export function makeRecipe(
  id: string,
  title: string,
  ingredients: readonly IngredientSpec[],
  overrides: Partial<Recipe> = {},
): Recipe {
  return {
    id,
    title,
    blurb: `${title}, the easy way.`,
    minutes: 30,
    serves: 2,
    course: 'main',
    diet: ['vegetarian'],
    ingredients: ingredients.map(toRecipeIngredient),
    steps: ['Cook it.', 'Eat it.'],
    ...overrides,
  }
}

export const RECIPES: readonly Recipe[] = [
  makeRecipe('courgette-fritters', 'Courgette fritters', [
    'courgette',
    'feta',
    'egg',
    { id: 'basil', optional: true },
    'salt',
  ]),
  makeRecipe('tomato-salad', 'Tomato salad', ['tomato', 'basil', 'salt'], {
    course: 'salad',
    diet: ['vegan', 'vegetarian'],
  }),
  makeRecipe('patatas-bravas', 'Patatas bravas', ['potato', 'tomato', 'smoked-paprika', 'salt'], {
    diet: ['vegan', 'vegetarian'],
  }),
  makeRecipe('spanish-omelette', 'Spanish omelette', ['potato', 'egg', 'salt']),
  makeRecipe('courgette-soup', 'Courgette soup', ['courgette', 'potato', { id: 'basil', optional: true }, 'salt'], {
    course: 'soup',
    diet: ['vegan', 'vegetarian'],
  }),
  makeRecipe('shakshuka', 'Shakshuka', ['tomato', 'egg', 'smoked-paprika', { id: 'feta', optional: true }]),
]

export const CATALOGUE = buildCatalogue(INGREDIENTS, RECIPES)

export function ready(ingredientId: IngredientId, glut = false): HarvestItem {
  return { ingredientId, status: 'ready', glut, addedOn: '2026-10-01' }
}

export function soon(ingredientId: IngredientId, glut = false): HarvestItem {
  return { ingredientId, status: 'soon', glut, addedOn: '2026-10-01' }
}

export function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    harvest: [],
    larder: [],
    plan: {},
    shoppingTicks: {},
    myRecipes: [],
    myIngredients: [],
    ...overrides,
  }
}

/** Freezes every nested object and array, so any mutation in the code under test throws. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
