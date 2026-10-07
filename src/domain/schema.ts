import { z } from 'zod'

// zod probes for `new Function` to speed up parsing; our CSP forbids that, so
// skip the probe rather than log a violation on every load.
z.config({ jitless: true })
import { isISODate } from './dates'
import { AISLES, ART_KEYS, COURSES, DIETS, HARVEST_STATUSES, MY_ID_PREFIX, type AppState } from './types'

/**
 * Size caps for everything stored, so a hostile or broken backup can't bloat
 * the app. The UI can use these for input maxLength too.
 */
export const LIMITS = {
  idLength: 64,
  /** Harvest items, larder items, and ticks in any one week. */
  listItems: 500,
  /** About ten years of days. */
  planDays: 3700,
  mealsPerDay: 20,
  tickWeeks: 530,
  titleLength: 80,
  nameLength: 80,
  blurbLength: 200,
  amountLength: 80,
  prepLength: 80,
  stepLength: 600,
  steps: 30,
  recipeIngredients: 30,
  myRecipes: 300,
  myIngredients: 300,
  minutes: 9999,
  serves: 99,
} as const

const isUnique = <T>(key: (item: T) => string) => (items: readonly T[]) =>
  new Set(items.map(key)).size === items.length
const byId = (item: { id: string }) => item.id

const sizeAtMost = (max: number) => (record: object) => Object.keys(record).length <= max

const isoDate = z.string().refine(isISODate, { error: 'Not a calendar date' })
/** Lower-case letters, digits and hyphens only: every id we make looks like this, and it keeps ids inert anywhere they end up (keys, selectors, URLs). */
const id = z
  .string()
  .min(1)
  .max(LIMITS.idLength)
  .regex(/^[a-z0-9-]+$/, { error: 'Not a valid id' })
const myId = id.refine((value) => value.startsWith(MY_ID_PREFIX), { error: `Must start with ${MY_ID_PREFIX}` })
const nonBlank = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => value.trim().length > 0, { error: 'Must not be blank' })

const ingredientIds = z
  .array(id)
  .max(LIMITS.listItems)
  .refine(isUnique((value: string) => value), { error: 'Duplicate id' })

const harvestItem = z.object({
  ingredientId: id,
  status: z.enum(HARVEST_STATUSES),
  glut: z.boolean(),
  addedOn: isoDate,
})

const plannedMeal = z.object({
  id,
  recipeId: id,
  cooked: z.boolean(),
})

const recipeIngredient = z.object({
  id,
  amount: z.string().max(LIMITS.amountLength),
  optional: z.boolean().optional(),
  prep: z.string().max(LIMITS.prepLength).optional(),
})

export const myRecipeSchema = z.object({
  id: myId,
  title: nonBlank(LIMITS.titleLength),
  blurb: z.string().max(LIMITS.blurbLength),
  minutes: z.int().min(0).max(LIMITS.minutes),
  serves: z.int().min(1).max(LIMITS.serves),
  course: z.enum(COURSES),
  diet: z.array(z.enum(DIETS)).max(DIETS.length),
  ingredients: z.array(recipeIngredient).max(LIMITS.recipeIngredients),
  steps: z.array(z.string().max(LIMITS.stepLength)).max(LIMITS.steps),
})

export const myIngredientSchema = z
  .object({
    id: myId,
    name: nonBlank(LIMITS.nameLength),
    aisle: z.enum(AISLES),
    growable: z.boolean(),
    art: z.enum(ART_KEYS).optional(),
    harvestMonths: z.array(z.int().min(1).max(12)).max(12).optional(),
    assumed: z.boolean().optional(),
  })
  .refine((ingredient) => !ingredient.growable || ingredient.art !== undefined, {
    error: 'A growable ingredient needs a drawing',
  })

export const appStateSchema = z.object({
  version: z.literal(1),
  harvest: z
    .array(harvestItem)
    .max(LIMITS.listItems)
    .refine(isUnique((item: { ingredientId: string }) => item.ingredientId), { error: 'Duplicate crop' }),
  larder: ingredientIds,
  plan: z
    .record(isoDate, z.array(plannedMeal).max(LIMITS.mealsPerDay))
    .refine(sizeAtMost(LIMITS.planDays), { error: 'Too many planned days' }),
  shoppingTicks: z
    .record(isoDate, ingredientIds)
    .refine(sizeAtMost(LIMITS.tickWeeks), { error: 'Too many weeks of ticks' }),
  // Defaults let dev data saved before these existed still load.
  myRecipes: z
    .array(myRecipeSchema)
    .max(LIMITS.myRecipes)
    .refine(isUnique(byId), { error: 'Duplicate recipe' })
    .default([]),
  myIngredients: z
    .array(myIngredientSchema)
    .max(LIMITS.myIngredients)
    .refine(isUnique(byId), { error: 'Duplicate ingredient' })
    .default([]),
}) satisfies z.ZodType<AppState>

export function isValidState(value: unknown): value is AppState {
  return appStateSchema.safeParse(value).success
}
