import type {
  AppState,
  Catalogue,
  Diet,
  HarvestItem,
  Ingredient,
  IngredientId,
  Recipe,
  RecipeId,
} from './types'

/** What you've got: the reference catalogue plus the patch and larder from state. */
export interface Supplies {
  catalogue: Catalogue
  harvest: readonly HarvestItem[]
  larder: readonly IngredientId[]
}

export function buildCatalogue(ingredients: readonly Ingredient[], recipes: readonly Recipe[]): Catalogue {
  return {
    ingredients: new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    recipes,
  }
}

export function findRecipe(catalogue: Catalogue, recipeId: RecipeId): Recipe | undefined {
  return catalogue.recipes.find((recipe) => recipe.id === recipeId)
}

/**
 * A fast "do I have it?" check for many lookups against the same supplies.
 * Ids missing from the catalogue are never had.
 */
export function haveChecker({ catalogue, harvest, larder }: Supplies): (id: IngredientId) => boolean {
  const harvested = new Set(harvest.map((item) => item.ingredientId))
  const inLarder = new Set(larder)
  return (id) => {
    const ingredient = catalogue.ingredients.get(id)
    if (!ingredient) return false
    return harvested.has(id) || inLarder.has(id) || ingredient.assumed === true
  }
}

/** You have an ingredient if it is in the harvest (any status), in the larder, or assumed. */
export function hasIngredient(id: IngredientId, supplies: Supplies): boolean {
  return haveChecker(supplies)(id)
}

/**
 * The built-in catalogue plus the user's own ingredients and recipes. Built-in
 * ids win on a clash. Returns `catalogue` itself when there is nothing to add.
 */
export function withMyContent(
  catalogue: Catalogue,
  { myRecipes, myIngredients }: Pick<AppState, 'myRecipes' | 'myIngredients'>,
): Catalogue {
  if (myRecipes.length === 0 && myIngredients.length === 0) return catalogue
  const ingredients = new Map(catalogue.ingredients)
  for (const ingredient of myIngredients) {
    if (!ingredients.has(ingredient.id)) ingredients.set(ingredient.id, ingredient)
  }
  const builtInRecipeIds = new Set(catalogue.recipes.map((recipe) => recipe.id))
  const recipes = [...catalogue.recipes, ...myRecipes.filter((recipe) => !builtInRecipeIds.has(recipe.id))]
  return { ingredients, recipes }
}

const HONEY_ID = 'honey'

/**
 * No meat or fish means vegetarian; no meat, fish, dairy, eggs or honey as
 * well means vegan. Ids missing from the catalogue don't count.
 */
export function deriveDiet(ingredientIds: readonly IngredientId[], catalogue: Catalogue): Diet[] {
  const known = ingredientIds.flatMap((id) => catalogue.ingredients.get(id) ?? [])
  if (known.some((ingredient) => ingredient.aisle === 'meat-fish')) return []
  const vegan = known.every((ingredient) => ingredient.aisle !== 'dairy-eggs' && ingredient.id !== HONEY_ID)
  return vegan ? ['vegan', 'vegetarian'] : ['vegetarian']
}
