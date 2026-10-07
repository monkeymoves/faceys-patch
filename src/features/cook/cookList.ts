import type { IngredientId, Recipe, RecipeMatch } from '../../domain'
import { MEAL_COURSES } from '../recipes/recipeParts'

export type CookFilter = 'all' | 'ready' | 'veggie' | 'mine'

export const COOK_FILTERS: readonly { value: CookFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready to cook' },
  { value: 'veggie', label: 'Veggie' },
  { value: 'mine', label: 'Mine' },
]

/** A recipe on the Cook list. `match` is missing for one of yours that uses nothing from the patch. */
export interface CookEntry {
  recipe: Recipe
  match?: RecipeMatch
}

function passes(match: RecipeMatch, filter: CookFilter): boolean {
  if (filter === 'ready') return match.readiness === 'ready'
  if (filter === 'veggie') return match.recipe.diet.includes('vegetarian')
  return true
}

/**
 * What Cook shows, best first. Mine lists every recipe of yours: the matched
 * ones in match order, then the rest A to Z. `withId` keeps only recipes
 * using that patch ingredient.
 */
export function cookEntries(
  matches: readonly RecipeMatch[],
  myRecipes: readonly Recipe[],
  filter: CookFilter,
  withId: IngredientId | undefined,
): CookEntry[] {
  let entries: CookEntry[]
  if (filter === 'mine') {
    const mineIds = new Set(myRecipes.map((recipe) => recipe.id))
    const matched = matches.filter((match) => mineIds.has(match.recipe.id))
    const matchedIds = new Set(matched.map((match) => match.recipe.id))
    const unmatched = myRecipes
      .filter((recipe) => !matchedIds.has(recipe.id))
      .toSorted((a, b) => a.title.localeCompare(b.title, 'en-GB'))
    entries = [...matched.map((match) => ({ recipe: match.recipe, match })), ...unmatched.map((recipe) => ({ recipe }))]
  } else {
    entries = matches.filter((match) => passes(match, filter)).map((match) => ({ recipe: match.recipe, match }))
  }
  return withId === undefined ? entries : entries.filter((entry) => entry.match?.fromPatch.includes(withId))
}

/** Meals (main, soup, salad, side) and then bakes, puddings and preserves, each keeping its order. */
export function splitByCourse(entries: readonly CookEntry[]): { meals: CookEntry[]; treats: CookEntry[] } {
  return {
    meals: entries.filter((entry) => MEAL_COURSES.has(entry.recipe.course)),
    treats: entries.filter((entry) => !MEAL_COURSES.has(entry.recipe.course)),
  }
}

export interface EmptyCopy {
  title: string
  text: string
}

const EMPTY_COPY: Record<CookFilter, EmptyCopy> = {
  all: { title: 'Nothing to show', text: 'Try another filter.' },
  ready: { title: 'Nothing is ready to cook as it is', text: 'Every recipe here needs a thing or two. Try All.' },
  veggie: { title: 'No veggie recipes for this lot', text: "Nothing veggie uses what's on the patch. Try All." },
  mine: { title: 'No recipes of your own yet', text: 'Write down the ones you make again and again.' },
}

const EMPTY_WITH_COPY: Record<CookFilter, (name: string) => EmptyCopy> = {
  all: (name) => ({ title: `Nothing uses ${name} yet`, text: 'Try showing all the recipes instead.' }),
  ready: (name) => ({ title: `Nothing with ${name} is ready to cook`, text: 'Try All to see what needs a shop.' }),
  veggie: (name) => ({ title: `Nothing veggie uses ${name}`, text: 'Try All to see the rest.' }),
  mine: (name) => ({ title: `None of yours use ${name}`, text: 'Write one down, or try All.' }),
}

/** What to say when a filter leaves nothing to show. `withName` is lower-case, e.g. 'courgettes'. */
export function emptyFilterCopy(filter: CookFilter, withName: string | undefined): EmptyCopy {
  return withName ? EMPTY_WITH_COPY[filter](withName) : EMPTY_COPY[filter]
}
