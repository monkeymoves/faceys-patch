import { findRecipe, type Catalogue, type RecipeId } from '../../domain'

const andList = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' })

/** 'for Ratatouille and Shakshuka', or '' when none of the recipes are known any more. */
export function forRecipes(recipeIds: readonly RecipeId[], catalogue: Catalogue): string {
  const titles = recipeIds.flatMap((id) => findRecipe(catalogue, id)?.title ?? [])
  return titles.length > 0 ? `for ${andList.format(titles)}` : ''
}

/** '3 things put in the larder.', or 'Feta put in the larder.' for just one. */
export function movedMessage(names: readonly string[]): string {
  const [only] = names
  if (names.length === 1 && only) return `${only} put in the larder.`
  return `${names.length} things put in the larder.`
}

/** True when a share sheet was closed without sharing, which is not a problem. */
export const isCancelled = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
