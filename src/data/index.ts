import type { Catalogue, IngredientId } from '../domain/types'
import { INGREDIENTS } from './ingredients'
import { RECIPES } from './recipes'

export { INGREDIENTS, RECIPES }

/** The usual suspects most kitchens have. Used by "Add the usual suspects" in the Larder. */
export const STARTER_LARDER: readonly IngredientId[] = [
  'olive-oil',
  'vegetable-oil',
  'butter',
  'plain-flour',
  'egg',
  'milk',
  'onion',
  'garlic',
  'vegetable-stock',
  'long-grain-rice',
  'pasta',
  'chopped-tomatoes',
  'cheddar',
  'caster-sugar',
  'white-wine-vinegar',
  'mustard',
  'soy-sauce',
  'ground-cumin',
  'smoked-paprika',
  'chilli-flakes',
]

export const CATALOGUE: Catalogue = {
  ingredients: new Map(INGREDIENTS.map((i) => [i.id, i])),
  recipes: RECIPES,
}
