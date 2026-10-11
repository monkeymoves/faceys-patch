/**
 * Shared domain types for Facey's Patch.
 *
 * This file is the contract between the data, domain, art and UI layers.
 * See docs/SPEC.md for the vocabulary (Patch, Larder, Week, Shop).
 */

/** A local calendar date, always formatted 'YYYY-MM-DD'. Never a timestamp. */
export type ISODate = string

/** A calendar month, always formatted 'YYYY-MM'. */
export type ISOMonth = string

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

export const DIETS = ['vegetarian', 'vegan'] as const

export type Diet = (typeof DIETS)[number]

export const COURSES = ['main', 'soup', 'salad', 'side', 'pudding', 'bake', 'preserve'] as const

export type Course = (typeof COURSES)[number]

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
// Growing: when to sow and plant, and jobs on the plot (reference data in src/data)
// ---------------------------------------------------------------------------

/**
 * How and when a crop gets going in the UK. Months are 1 = January. A crop may
 * have any mix of the three: sown under cover then planted out (tomatoes),
 * sown straight in the ground (carrots), or planted as sets, tubers, crowns,
 * canes or bought plants (onions, potatoes, rhubarb, raspberries). Harvest
 * months live on the Ingredient.
 */
export interface CropGuide {
  ingredientId: IngredientId
  /** Sow under cover: windowsill, greenhouse, cold frame or propagator. */
  sowIndoors?: readonly number[]
  /** Sow straight into the ground outside. */
  sowOutdoors?: readonly number[]
  /** Put plants in the ground: seedlings raised indoors, bought plants, sets, tubers, crowns or canes. */
  plantOut?: readonly number[]
  /** Two to four plain sentences: site, spacing, watering, pests, pitfalls. */
  tips: readonly string[]
}

/** What sort of job it is. Drives the drawn icon and the grouping on the Grow screen. */
export const JOB_KINDS = ['sow', 'plant', 'tend', 'protect', 'harvest', 'prepare'] as const

export type JobKind = (typeof JOB_KINDS)[number]

/** A built-in job on the plot. Ids are stable forever: ticks and hides are stored against them. */
export interface Job {
  id: string
  /** Short and imperative: 'Mulch empty beds for winter'. */
  title: string
  /** One to three plain sentences of advice. */
  note: string
  kind: JobKind
  /** Months it comes round, every year. */
  months: readonly number[]
  /** The crops it is about, when it is about particular ones. The first with a drawing is shown. */
  crops?: readonly IngredientId[]
}

/** Read-only reference data about growing, injected into domain functions like Catalogue. */
export interface Almanac {
  guides: ReadonlyMap<IngredientId, CropGuide>
  jobs: readonly Job[]
}

// ---------------------------------------------------------------------------
// User state (persisted on the device)
// ---------------------------------------------------------------------------

/** 'ready' = picked or ready to pick now. 'soon' = ready within the next week. */
export const HARVEST_STATUSES = ['ready', 'soon'] as const

export type HarvestStatus = (typeof HARVEST_STATUSES)[number]

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

/** Ids of user-written recipes, ingredients and jobs start with this, so they never clash with built-in ids. */
export const MY_ID_PREFIX = 'my-'

/**
 * A job the person added. Either comes round in `months` every year, or
 * happens just once on `on` (then `months` is empty).
 */
export interface MyJob {
  id: string
  title: string
  note: string
  kind: JobKind
  months: readonly number[]
  on?: ISODate
}

export interface AppState {
  version: 1
  harvest: readonly HarvestItem[]
  /** What's in the cupboard/fridge. Any ingredient may be here, grown or bought. Unique ids. */
  larder: readonly IngredientId[]
  plan: MealPlan
  /** Ingredients ticked off the Shop list, keyed by the Monday that starts the week. */
  shoppingTicks: Readonly<Record<ISODate, readonly IngredientId[]>>
  /** Recipes the user has written. Ids start with MY_ID_PREFIX. */
  myRecipes: readonly Recipe[]
  /**
   * Ingredients the user added because the built-in list didn't have them.
   * Ids start with MY_ID_PREFIX. Growable ones use art 'seedling' and may
   * have empty harvestMonths.
   */
  myIngredients: readonly Ingredient[]
  /** Jobs the person added. Ids start with MY_ID_PREFIX. */
  myJobs: readonly MyJob[]
  /**
   * Jobs ticked off, keyed by the month they were ticked in ('YYYY-MM'), so a
   * yearly job comes back untouched next year. Built-in and own ids alike.
   */
  jobsDone: Readonly<Record<ISOMonth, readonly string[]>>
  /** Built-in jobs the person has put aside as not for their plot. */
  hiddenJobs: readonly string[]
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
