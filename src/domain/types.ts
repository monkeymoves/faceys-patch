/**
 * Shared domain types for Facey's Patch.
 *
 * This file is the contract between the data, domain, art and UI layers.
 * See docs/SPEC.md for the vocabulary (Patch, Larder, Week, Shop).
 */

/** A local calendar date, always formatted 'YYYY-MM-DD'. Never a timestamp. */
export type ISODate = string

/** Kebab-case, singular, stable forever once shipped (it is stored on devices). */
export type IngredientId = string
export type RecipeId = string

/**
 * Hand-drawn illustrations available in src/art. Several ingredients may share
 * one drawing (basil, parsley and mint all use 'herb-soft').
 */
export const ART_KEYS = [
  // Veg
  'asparagus',
  'aubergine',
  'bean',
  'beetroot',
  'broad-bean',
  'broccoli',
  'brussels-sprout',
  'cabbage',
  'carrot',
  'cauliflower',
  'celeriac',
  'celery',
  'chard',
  'chilli',
  'courgette',
  'cucumber',
  'fennel',
  'garlic',
  'kale',
  'leek',
  'lettuce',
  'onion',
  'parsnip',
  'pea',
  'pepper',
  'potato',
  'pumpkin',
  'radish',
  'spinach',
  'spring-onion',
  'swede',
  'sweetcorn',
  'tomato',
  // Fruit
  'apple',
  'blackberry',
  'currant',
  'gooseberry',
  'pear',
  'plum',
  'raspberry',
  'rhubarb',
  'strawberry',
  // Herbs
  'herb-soft',
  'herb-woody',
  // Fallback for anything without its own drawing
  'seedling',
] as const

export type ArtKey = (typeof ART_KEYS)[number]

/** Where something lives in a kitchen or shop. Drives Larder grouping and Shop ordering. */
export const AISLES = [
  'veg',
  'fruit',
  'herbs',
  'dairy-eggs',
  'meat-fish',
  'bread-pastry',
  'dry-goods',
  'tins-jars',
  'oils-sauces',
  'spices',
] as const

export type Aisle = (typeof AISLES)[number]

export interface Ingredient {
  id: IngredientId
  /** Display name as you'd write it on a list, e.g. 'Courgettes', 'Olive oil'. */
  name: string
  aisle: Aisle
  /** Can be grown on a UK allotment, so it appears in the Patch picker. */
  growable: boolean
  /** Required when growable. */
  art?: ArtKey
  /** Typical UK harvest (or from-store) months, 1 = January. Growable only. */
  harvestMonths?: readonly number[]
  /** Always available (salt, pepper, water). Never counted as missing or put on the Shop list. */
  assumed?: boolean
}

export interface RecipeIngredient {
  id: IngredientId
  /** Free text, written like a person would: '2 big handfuls', 'about 400g'. */
  amount: string
  /** Nice to have. Never makes a recipe "missing" anything and never goes on the Shop list. */
  optional?: boolean
  /** e.g. 'finely sliced' */
  prep?: string
}

export type Diet = 'vegetarian' | 'vegan'

export type Course = 'main' | 'side' | 'soup' | 'salad' | 'pudding' | 'preserve' | 'bake'

export interface Recipe {
  id: RecipeId
  title: string
  /** One plain sentence. */
  blurb: string
  minutes: number
  serves: number
  course: Course
  /** A vegan recipe lists both 'vegan' and 'vegetarian'. Meat or fish recipes list neither. */
  diet: readonly Diet[]
  ingredients: readonly RecipeIngredient[]
  steps: readonly string[]
}

/** Read-only reference data, injected into domain functions so tests can use small fixtures. */
export interface Catalogue {
  ingredients: ReadonlyMap<IngredientId, Ingredient>
  recipes: readonly Recipe[]
}

// ---------------------------------------------------------------------------
// User state (persisted on the device)
// ---------------------------------------------------------------------------

/** 'ready' = picked or ready to pick now. 'soon' = ready within the next week. */
export type HarvestStatus = 'ready' | 'soon'

/** One entry per crop: ingredientId is unique within AppState.harvest. */
export interface HarvestItem {
  ingredientId: IngredientId
  status: HarvestStatus
  /** "Loads of it": the planner tries hard to use it up. */
  glut: boolean
  addedOn: ISODate
}

export interface PlannedMeal {
  /** Unique id so the same recipe can be planned twice. */
  id: string
  recipeId: RecipeId
  cooked: boolean
}

/** Meals keyed by date. A missing key and an empty array both mean "nothing planned". */
export type MealPlan = Readonly<Record<ISODate, readonly PlannedMeal[]>>

export interface AppState {
  version: 1
  harvest: readonly HarvestItem[]
  /** What's in the cupboard/fridge. Any ingredient may be here, grown or bought. Unique ids. */
  larder: readonly IngredientId[]
  plan: MealPlan
  /** Ingredients ticked off the Shop list, keyed by the Monday that starts the week. */
  shoppingTicks: Readonly<Record<ISODate, readonly IngredientId[]>>
}

// ---------------------------------------------------------------------------
// Derived results (computed by src/domain, never stored)
// ---------------------------------------------------------------------------

/** 'ready' = nothing to buy. 'nearly' = 1 or 2 things to buy. 'shop' = 3 or more. */
export type Readiness = 'ready' | 'nearly' | 'shop'

export interface RecipeMatch {
  recipe: Recipe
  /** Ingredients (required or optional) currently in the harvest. Always at least one. */
  fromPatch: readonly IngredientId[]
  /** Ingredients (required or optional) in the larder and not already counted from the patch. */
  fromLarder: readonly IngredientId[]
  /** Required, non-assumed ingredients you don't have. */
  missing: readonly IngredientId[]
  readiness: Readiness
  /** Higher is better. Only meaningful for ordering. */
  score: number
}

export interface ShoppingItem {
  ingredientId: IngredientId
  name: string
  aisle: Aisle
  /** Which planned recipes need it, in plan order, without duplicates. */
  forRecipes: readonly RecipeId[]
  ticked: boolean
}
