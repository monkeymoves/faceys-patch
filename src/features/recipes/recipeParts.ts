/*
 * Pure helpers shared by the recipe view, the Cook list and the Week pickers.
 * No React here, so the screens' .tsx files only export components.
 */
import {
  addDays,
  findRecipe,
  startOfWeek,
  type ArtKey,
  type Catalogue,
  type Course,
  type Ingredient,
  type IngredientId,
  type ISODate,
  type MealPlan,
  type Recipe,
  type RecipeMatch,
  type Supplies,
} from '../../domain'

/** One ingredient line in the recipe view. */
export interface IngredientLine {
  ingredient: Ingredient
  /** Amount and prep together, e.g. '3 medium, sliced'. May be empty. */
  amount: string
  optional: boolean
}

export interface IngredientGroups {
  patch: IngredientLine[]
  /** What's in the larder, then anything assumed (salt, pepper, water). */
  larder: IngredientLine[]
  buy: IngredientLine[]
}

export function amountText(amount: string, prep: string | undefined): string {
  return [amount.trim(), prep?.trim() ?? ''].filter(Boolean).join(', ')
}

/**
 * Splits a recipe's ingredients into what's on the patch, what's in the larder
 * and what you'd need to buy. Ids missing from the catalogue are skipped.
 */
export function groupIngredients(recipe: Recipe, { catalogue, harvest, larder }: Supplies): IngredientGroups {
  const onPatch = new Set(harvest.map((item) => item.ingredientId))
  const inLarder = new Set(larder)
  const groups: IngredientGroups = { patch: [], larder: [], buy: [] }
  const assumed: IngredientLine[] = []
  for (const item of recipe.ingredients) {
    const ingredient = catalogue.ingredients.get(item.id)
    if (!ingredient) continue
    const line = { ingredient, amount: amountText(item.amount, item.prep), optional: item.optional === true }
    if (onPatch.has(item.id)) groups.patch.push(line)
    else if (inLarder.has(item.id)) groups.larder.push(line)
    else if (ingredient.assumed) assumed.push(line)
    else groups.buy.push(line)
  }
  groups.larder.push(...assumed)
  return groups
}

/** 'Vegan', 'Veggie', or nothing for meat and fish. */
export function dietLabel(recipe: Recipe): string | undefined {
  if (recipe.diet.includes('vegan')) return 'Vegan'
  if (recipe.diet.includes('vegetarian')) return 'Veggie'
  return undefined
}

/** A name that reads naturally mid-sentence: 'Lemon' becomes 'lemon'. */
export function lowerName(ingredient: Ingredient): string {
  return ingredient.name.toLocaleLowerCase('en-GB')
}

export interface VegDrawing {
  art: ArtKey
  name: string
}

/** The patch veg a match uses, as drawings with natural names. */
export function patchDrawings(ids: readonly IngredientId[], catalogue: Catalogue): VegDrawing[] {
  return ids.flatMap((id) => {
    const ingredient = catalogue.ingredients.get(id)
    return ingredient ? [{ art: ingredient.art ?? 'seedling', name: lowerName(ingredient) }] : []
  })
}

/** Names of what you'd need to buy, lower-cased: ['lemon', 'feta']. */
export function missingNames(ids: readonly IngredientId[], catalogue: Catalogue): string[] {
  return ids.flatMap((id) => {
    const ingredient = catalogue.ingredients.get(id)
    return ingredient ? [lowerName(ingredient)] : []
  })
}

/** Courses for the "Meals" section of Cook. The rest are bakes, puddings and preserves. */
export const MEAL_COURSES: ReadonlySet<Course> = new Set<Course>(['main', 'soup', 'salad', 'side'])

/** Lower-case, accents off, single spaces: so 'gruyere' finds 'Gruyère'. */
export function normalise(text: string): string {
  return text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('en-GB').replace(/\s+/g, ' ').trim()
}

/** Titles of the known recipes planned on `date`, in plan order. */
export function plannedTitles(plan: MealPlan, date: ISODate, catalogue: Catalogue): string[] {
  return (plan[date] ?? []).flatMap((meal) => findRecipe(catalogue, meal.recipeId)?.title ?? [])
}

export interface DayChoice {
  date: ISODate
  today: boolean
  planned: string[]
}

export interface DayChoiceGroup {
  /** 'This week', 'Next week' or 'The week after'. */
  label: string
  days: DayChoice[]
}

const WEEK_LABELS = ['This week', 'Next week', 'The week after'] as const

/** Today plus the next 13 days, grouped by calendar week (Monday first). */
export function upcomingDays(today: ISODate, plan: MealPlan, catalogue: Catalogue): DayChoiceGroup[] {
  const thisWeek = startOfWeek(today)
  const weekStarts = WEEK_LABELS.map((_, index) => addDays(thisWeek, index * 7))
  const groups: DayChoiceGroup[] = []
  for (let offset = 0; offset < 14; offset++) {
    const date = addDays(today, offset)
    const label = WEEK_LABELS[weekStarts.indexOf(startOfWeek(date))] ?? 'Later'
    let group = groups.at(-1)
    if (!group || group.label !== label) {
      group = { label, days: [] }
      groups.push(group)
    }
    group.days.push({ date, today: offset === 0, planned: plannedTitles(plan, date, catalogue) })
  }
  return groups
}

/** Best matches for a dinner: plannable courses first, then the rest, each keeping match order. */
export function dinnerFirst(matches: readonly RecipeMatch[], plannable: ReadonlySet<Course>): RecipeMatch[] {
  return [
    ...matches.filter((match) => plannable.has(match.recipe.course)),
    ...matches.filter((match) => !plannable.has(match.recipe.course)),
  ]
}
