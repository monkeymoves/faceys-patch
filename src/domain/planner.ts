import { findRecipe, type Supplies } from './catalogue'
import { isISODate, startOfWeek, weekDates } from './dates'
import { compareMatches, matchRecipes, patchPoints } from './matching'
import type {
  Catalogue,
  Course,
  HarvestItem,
  IngredientId,
  ISODate,
  MealPlan,
  PlannedMeal,
  RecipeId,
  RecipeMatch,
} from './types'

/** Courses the planner may put on a day as dinner. Matching (the Cook screen) still shows every course. */
export const PLANNABLE_COURSES = ['main', 'soup'] as const satisfies readonly Course[]

export interface PlanWeekInput extends Supplies {
  plan: MealPlan
  dates: readonly ISODate[]
}

const GLUT_FREE_USES = 2
/** Soon items stay off this many dates at the start of a run, while there is any alternative. */
const SOON_HOLD_OFF_DATES = 2

/**
 * The meals on `date` whose recipe the catalogue still knows, in plan order.
 * A meal whose recipe has since gone is skipped, never shown blank.
 */
export function knownMeals(plan: MealPlan, date: ISODate, catalogue: Catalogue): PlannedMeal[] {
  return (plan[date] ?? []).filter((meal) => findRecipe(catalogue, meal.recipeId) !== undefined)
}

/** True if `date` holds a meal you can see. A day holding only a recipe that has gone counts as empty. */
export function hasKnownMeals(plan: MealPlan, date: ISODate, catalogue: Catalogue): boolean {
  return knownMeals(plan, date, catalogue).length > 0
}

/** How much of an ingredient's points still count after `uses` earlier uses this week. */
function varietyFactor(uses: number, glut: boolean): number {
  return 0.5 ** (glut ? Math.max(0, uses - GLUT_FREE_USES) : uses)
}

/**
 * Picks one recipe for each empty date, in date order. Returns only the dates
 * it filled; dates that already hold a meal, or that run out of candidates,
 * are left out.
 */
export function planWeek(input: PlanWeekInput): Record<ISODate, RecipeId> {
  const { catalogue, harvest, plan, dates } = input
  const plannable = new Set<Course>(PLANNABLE_COURSES)
  const matches = matchRecipes(input).filter((match) => plannable.has(match.recipe.course))
  const harvestById = new Map(harvest.map((item) => [item.ingredientId, item]))
  const runDates = [...new Set(dates.filter(isISODate))].sort()
  const chosen: Record<ISODate, RecipeId> = {}
  const chosenInRun = new Set<RecipeId>()

  /** Every recipe on the plan, or chosen in this run, in the week holding `date`. */
  const recipesInWeekOf = (date: ISODate): RecipeId[] =>
    weekDates(startOfWeek(date)).flatMap((day) => [
      ...(plan[day] ?? []).map((meal) => meal.recipeId),
      ...(chosen[day] ? [chosen[day]] : []),
    ])

  /** How many of those recipes use each patch ingredient. */
  const countPatchUses = (recipeIds: readonly RecipeId[]): Map<IngredientId, number> => {
    const uses = new Map<IngredientId, number>()
    for (const recipeId of recipeIds) {
      const ids = new Set(findRecipe(catalogue, recipeId)?.ingredients.map((ingredient) => ingredient.id))
      for (const id of ids) {
        if (harvestById.has(id)) uses.set(id, (uses.get(id) ?? 0) + 1)
      }
    }
    return uses
  }

  /** The match's score with each patch ingredient's points cut back for earlier uses. */
  const withVariety = (match: RecipeMatch, uses: Map<IngredientId, number>): RecipeMatch => {
    const lost = match.fromPatch.reduce((total, id) => {
      const item = harvestById.get(id) as HarvestItem // fromPatch only holds harvested ids
      const optional = match.recipe.ingredients.some((ingredient) => ingredient.id === id && ingredient.optional)
      return total + patchPoints(item, optional) * (1 - varietyFactor(uses.get(id) ?? 0, item.glut))
    }, 0)
    return { ...match, score: match.score - lost }
  }

  const usesSoonItem = (match: RecipeMatch) => match.fromPatch.some((id) => harvestById.get(id)?.status === 'soon')

  runDates.forEach((date, index) => {
    if (hasKnownMeals(plan, date, catalogue)) return
    const weekRecipes = recipesInWeekOf(date)
    const excluded = new Set([...weekRecipes, ...chosenInRun])
    const uses = countPatchUses(weekRecipes)
    const candidates = matches
      .filter((match) => !excluded.has(match.recipe.id))
      .map((match) => withVariety(match, uses))
      .sort(compareMatches)
    const ripe = candidates.filter((match) => !usesSoonItem(match))
    const pool = index < SOON_HOLD_OFF_DATES && ripe.length > 0 ? ripe : candidates
    const [best] = pool
    if (!best) return
    chosen[date] = best.recipe.id
    chosenInRun.add(best.recipe.id)
  })
  return chosen
}
