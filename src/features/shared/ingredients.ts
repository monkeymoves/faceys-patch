/*
 * "Not on the list?": the one place that turns a typed name into an
 * ingredient, shared by the Patch, the Larder and the recipe form. A name
 * already in the catalogue (built-in or the person's own) is reused, so
 * typing "mushrooms" never makes a second Mushrooms.
 */
import {
  AISLE_LABELS,
  AISLES,
  LIMITS,
  makeMyId,
  myIngredientSchema,
  type Aisle,
  type Catalogue,
  type Ingredient,
} from '../../domain'
import { sameName } from './text'

/** Every aisle, for a Select. */
export const AISLE_OPTIONS: readonly { value: Aisle; label: string }[] = AISLES.map((aisle) => ({
  value: aisle,
  label: AISLE_LABELS[aisle],
}))

/** The catalogue ingredient with this name (built-in or the person's own), ignoring case, accents and spacing. */
export function findByName(catalogue: Catalogue, name: string): Ingredient | undefined {
  if (name.trim() === '') return undefined
  for (const ingredient of catalogue.ingredients.values()) {
    if (sameName(ingredient.name, name)) return ingredient
  }
  return undefined
}

export interface NewIngredientInput {
  name: string
  /** Used only when a new one is made. */
  aisle: Aisle
  /** "I grow this". Used only when a new one is made. */
  grows: boolean
}

export type FindOrMakeResult =
  | {
      ok: true
      ingredient: Ingredient
      /** True when it is new: dispatch 'myIngredients/add' with it before using it. */
      isNew: boolean
    }
  | { ok: false; error: string }

/**
 * The ingredient called `name`: the one already in the catalogue if there is
 * one, otherwise a new one of the person's own (checked against the schema,
 * but not yet saved). New growable ones get the seedling drawing and no
 * harvest months. `mineSoFar` is how many of their own they already have.
 */
export function findOrMakeIngredient(
  catalogue: Catalogue,
  { name, aisle, grows }: NewIngredientInput,
  mineSoFar: number,
): FindOrMakeResult {
  const trimmed = name.trim()
  if (trimmed === '') return { ok: false, error: 'Give it a name.' }

  const existing = findByName(catalogue, trimmed)
  if (existing) return { ok: true, ingredient: existing, isNew: false }

  if (trimmed.length > LIMITS.nameLength) {
    return { ok: false, error: `Keep the name to ${LIMITS.nameLength} characters or fewer.` }
  }
  if (mineSoFar >= LIMITS.myIngredients) {
    return { ok: false, error: "You've added as many of your own ingredients as the app can keep." }
  }
  const ingredient: Ingredient = {
    id: makeMyId(trimmed),
    name: trimmed,
    aisle,
    growable: grows,
    ...(grows ? { art: 'seedling' as const, harvestMonths: [] } : {}),
  }
  return myIngredientSchema.safeParse(ingredient).success
    ? { ok: true, ingredient, isNew: true }
    : { ok: false, error: "That name won't work. Try a shorter one." }
}
