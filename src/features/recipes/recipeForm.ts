/*
 * The recipe form's model: a draft the person types into, checked against
 * LIMITS and myRecipeSchema before anything is dispatched (the reducer
 * silently refuses invalid changes, so the form has to catch them first).
 */
import {
  deriveDiet,
  LIMITS,
  makeMyId,
  myIngredientSchema,
  myRecipeSchema,
  type Aisle,
  type Catalogue,
  type Course,
  type Ingredient,
  type IngredientId,
  type Recipe,
  type RecipeIngredient,
} from '../../domain'
import { normalise } from './recipeParts'

export interface DraftRow {
  id: IngredientId
  amount: string
  optional: boolean
  /** Kept from a copied or edited recipe. The form has no field for it. */
  prep?: string
}

export interface RecipeDraft {
  title: string
  note: string
  minutes: number
  serves: number
  course: Course
  rows: DraftRow[]
  /** One step per line. */
  method: string
}

export type DraftField = 'title' | 'note' | 'minutes' | 'serves' | 'course' | 'ingredients' | 'method'
export type DraftErrors = Partial<Record<DraftField, string>>

export const COURSE_OPTIONS: readonly { value: Course; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'soup', label: 'Soup' },
  { value: 'salad', label: 'Salad' },
  { value: 'side', label: 'Side' },
  { value: 'pudding', label: 'Pudding' },
  { value: 'bake', label: 'Bake' },
  { value: 'preserve', label: 'Preserve' },
]

export const MINUTES_RANGE = { min: 5, max: 999, step: 5 } as const

export function emptyDraft(): RecipeDraft {
  return { title: '', note: '', minutes: 30, serves: 4, course: 'main', rows: [], method: '' }
}

const COPY_SUFFIX = ' (my version)'

/** A draft filled from an existing recipe. A copy gets "(my version)" on its title when it fits. */
export function draftFromRecipe(recipe: Recipe, copy: boolean): RecipeDraft {
  const title =
    copy && recipe.title.length + COPY_SUFFIX.length <= LIMITS.titleLength ? recipe.title + COPY_SUFFIX : recipe.title
  const seen = new Set<IngredientId>()
  const rows = recipe.ingredients.flatMap((ingredient): DraftRow[] => {
    if (seen.has(ingredient.id)) return []
    seen.add(ingredient.id)
    return [
      {
        id: ingredient.id,
        amount: ingredient.amount,
        optional: ingredient.optional === true,
        ...(ingredient.prep ? { prep: ingredient.prep } : {}),
      },
    ]
  })
  return {
    title,
    note: recipe.blurb,
    minutes: recipe.minutes,
    serves: recipe.serves,
    course: recipe.course,
    rows,
    method: recipe.steps.join('\n'),
  }
}

/** The method split into steps: one per line, trimmed, blank lines dropped. */
export function methodSteps(method: string): string[] {
  return method
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

const SCHEMA_FIELDS: Record<string, DraftField> = {
  title: 'title',
  blurb: 'note',
  minutes: 'minutes',
  serves: 'serves',
  course: 'course',
  ingredients: 'ingredients',
  steps: 'method',
}

export type CheckResult = { ok: true; recipe: Recipe } | { ok: false; errors: DraftErrors }

/** Turns a draft into a saveable recipe with id `id`, or plain-words errors per field. */
export function checkDraft(draft: RecipeDraft, id: string, catalogue: Catalogue): CheckResult {
  const errors: DraftErrors = {}
  const title = draft.title.trim()
  const blurb = draft.note.trim()
  const steps = methodSteps(draft.method)

  if (title === '') errors.title = 'Give it a name'
  else if (title.length > LIMITS.titleLength)
    errors.title = `Keep the name to ${LIMITS.titleLength} characters or fewer`

  if (blurb.length > LIMITS.blurbLength) errors.note = `Keep the note to ${LIMITS.blurbLength} characters or fewer`

  if (draft.rows.length === 0) errors.ingredients = 'Add at least one ingredient'
  else if (draft.rows.length > LIMITS.recipeIngredients) {
    errors.ingredients = `A recipe can have up to ${LIMITS.recipeIngredients} ingredients`
  } else if (draft.rows.some((row) => row.amount.trim().length > LIMITS.amountLength)) {
    errors.ingredients = `Keep each amount to ${LIMITS.amountLength} characters or fewer`
  }

  if (steps.length === 0) errors.method = 'Add at least one step'
  else if (steps.length > LIMITS.steps) errors.method = `Keep it to ${LIMITS.steps} steps or fewer`
  else if (steps.some((step) => step.length > LIMITS.stepLength)) {
    errors.method = `Each step can be up to ${LIMITS.stepLength} characters. Try splitting a long one in two.`
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const ingredients = draft.rows.map((row): RecipeIngredient => ({
    id: row.id,
    amount: row.amount.trim(),
    ...(row.optional ? { optional: true } : {}),
    ...(row.prep ? { prep: row.prep } : {}),
  }))
  const recipe: Recipe = {
    id,
    title,
    blurb,
    minutes: draft.minutes,
    serves: draft.serves,
    course: draft.course,
    diet: deriveDiet(
      draft.rows.map((row) => row.id),
      catalogue,
    ),
    ingredients,
    steps,
  }

  // A last check against the saved-state schema, so nothing is silently refused.
  const parsed = myRecipeSchema.safeParse(recipe)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = SCHEMA_FIELDS[String(issue.path[0])] ?? 'title'
      errors[field] ??= "Something here isn't quite right. Try shortening it."
    }
    return { ok: false, errors }
  }
  return { ok: true, recipe }
}

/** Catalogue ingredients whose name contains `query`, best first: starts-with, then word starts, then anywhere. */
export function searchIngredients(
  catalogue: Catalogue,
  query: string,
  exclude: ReadonlySet<IngredientId>,
  limit = 8,
): Ingredient[] {
  const wanted = normalise(query)
  if (wanted === '') return []
  const ranked = [...catalogue.ingredients.values()].flatMap((ingredient) => {
    if (exclude.has(ingredient.id)) return []
    const name = normalise(ingredient.name)
    if (!name.includes(wanted)) return []
    const rank = name.startsWith(wanted) ? 0 : name.split(' ').some((word) => word.startsWith(wanted)) ? 1 : 2
    return [{ ingredient, rank, name }]
  })
  return ranked
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'en-GB'))
    .slice(0, limit)
    .map((entry) => entry.ingredient)
}

/** An ingredient already in the catalogue with exactly this name (ignoring case and accents). */
export function findByName(catalogue: Catalogue, name: string): Ingredient | undefined {
  const wanted = normalise(name)
  if (wanted === '') return undefined
  return [...catalogue.ingredients.values()].find((ingredient) => normalise(ingredient.name) === wanted)
}

export interface NewIngredientInput {
  name: string
  aisle: Aisle
  grows: boolean
}

export type NewIngredientResult = { ok: true; ingredient: Ingredient } | { ok: false; error: string }

/** A new ingredient of the person's own. Growable ones get the seedling drawing and no harvest months yet. */
export function makeIngredient({ name, aisle, grows }: NewIngredientInput, mineSoFar: number): NewIngredientResult {
  const trimmed = name.trim()
  if (trimmed === '') return { ok: false, error: 'Give it a name' }
  if (trimmed.length > LIMITS.nameLength) {
    return { ok: false, error: `Keep the name to ${LIMITS.nameLength} characters or fewer` }
  }
  if (mineSoFar >= LIMITS.myIngredients) {
    return { ok: false, error: "You've added as many of your own ingredients as the app can keep" }
  }
  const ingredient: Ingredient = {
    id: makeMyId(trimmed),
    name: trimmed,
    aisle,
    growable: grows,
    ...(grows ? { art: 'seedling' as const, harvestMonths: [] } : {}),
  }
  return myIngredientSchema.safeParse(ingredient).success
    ? { ok: true, ingredient }
    : { ok: false, error: "That name won't work. Try a shorter one." }
}
