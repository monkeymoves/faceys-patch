import { haveChecker, type Supplies } from './catalogue'
import type { HarvestItem, Readiness, RecipeMatch } from './types'

const MISSING_PENALTY = 2
const READY_BONUS = 3

/** What one patch item adds to a recipe's score: 3 if ready, 1.5 if soon, doubled for a glut, halved if optional. */
export function patchPoints(item: HarvestItem, optional: boolean): number {
  const base = item.status === 'ready' ? 3 : 1.5
  return base * (item.glut ? 2 : 1) * (optional ? 0.5 : 1)
}

function readinessFor(missingCount: number): Readiness {
  if (missingCount === 0) return 'ready'
  return missingCount <= 2 ? 'nearly' : 'shop'
}

/** Best score first, then title A to Z, then id, so the order never depends on input order. */
export function compareMatches(a: RecipeMatch, b: RecipeMatch): number {
  return (
    b.score - a.score ||
    a.recipe.title.localeCompare(b.recipe.title, 'en-GB') ||
    compareIds(a.recipe.id, b.recipe.id)
  )
}

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Recipes that use at least one thing from the patch, best first. */
export function matchRecipes(supplies: Supplies): RecipeMatch[] {
  const { catalogue, harvest, larder } = supplies
  const harvestById = new Map(harvest.map((item) => [item.ingredientId, item]))
  const inLarder = new Set(larder)
  const have = haveChecker(supplies)

  return catalogue.recipes
    .flatMap((recipe): RecipeMatch[] => {
      // Ingredient ids missing from the catalogue are skipped entirely.
      const known = recipe.ingredients.filter((ingredient) => catalogue.ingredients.has(ingredient.id))
      let patchScore = 0
      const fromPatch = known.flatMap((ingredient) => {
        const item = harvestById.get(ingredient.id)
        if (!item) return []
        patchScore += patchPoints(item, ingredient.optional === true)
        return [ingredient.id]
      })
      if (fromPatch.length === 0) return []

      const fromLarder = known
        .filter((ingredient) => inLarder.has(ingredient.id) && !harvestById.has(ingredient.id))
        .map((ingredient) => ingredient.id)
      const missing = known
        .filter((ingredient) => ingredient.optional !== true && !have(ingredient.id))
        .map((ingredient) => ingredient.id)
      const readiness = readinessFor(missing.length)
      const score = patchScore - MISSING_PENALTY * missing.length + (readiness === 'ready' ? READY_BONUS : 0)
      return [{ recipe, fromPatch, fromLarder, missing, readiness, score }]
    })
    .sort(compareMatches)
}
