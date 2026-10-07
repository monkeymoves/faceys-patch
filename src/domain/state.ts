import { isValidState } from './schema'
import type {
  AppState,
  HarvestItem,
  HarvestStatus,
  Ingredient,
  IngredientId,
  ISODate,
  MealPlan,
  PlannedMeal,
  Recipe,
  RecipeId,
} from './types'

export function initialState(): AppState {
  return { version: 1, harvest: [], larder: [], plan: {}, shoppingTicks: {}, myRecipes: [], myIngredients: [] }
}

/**
 * Everything that can change the saved state. Ids for new meals, recipes and
 * ingredients are made by the caller, so the reducer stays pure.
 */
export type Action =
  | { type: 'harvest/add'; ingredientId: IngredientId; status: HarvestStatus; glut: boolean; today: ISODate }
  | { type: 'harvest/update'; ingredientId: IngredientId; status?: HarvestStatus; glut?: boolean }
  | { type: 'harvest/remove'; ingredientId: IngredientId }
  | { type: 'larder/add'; ingredientIds: readonly IngredientId[] }
  | { type: 'larder/remove'; ingredientId: IngredientId }
  | { type: 'plan/add'; date: ISODate; meal: PlannedMeal }
  | { type: 'plan/remove'; date: ISODate; mealId: string }
  | { type: 'plan/setCooked'; date: ISODate; mealId: string; cooked: boolean }
  | { type: 'plan/fill'; meals: Readonly<Record<ISODate, PlannedMeal>> }
  | { type: 'shop/toggle'; weekStart: ISODate; ingredientId: IngredientId }
  | { type: 'shop/moveTickedToLarder'; weekStart: ISODate }
  | { type: 'myRecipes/save'; recipe: Recipe }
  | { type: 'myRecipes/remove'; recipeId: RecipeId }
  | { type: 'myIngredients/add'; ingredient: Ingredient }
  | { type: 'state/replace'; state: AppState }
  | { type: 'state/reset' }

function updateHarvestItem(
  state: AppState,
  ingredientId: IngredientId,
  status: HarvestStatus | undefined,
  glut: boolean | undefined,
): AppState {
  const current = state.harvest.find((item) => item.ingredientId === ingredientId)
  if (!current) return state
  const updated: HarvestItem = { ...current, status: status ?? current.status, glut: glut ?? current.glut }
  if (updated.status === current.status && updated.glut === current.glut) return state
  return { ...state, harvest: state.harvest.map((item) => (item === current ? updated : item)) }
}

/** `ids` added to the end of `list`, skipping any already there. Returns `list` itself if nothing is new. */
function addUnique<T>(list: readonly T[], ids: readonly T[]): readonly T[] {
  const seen = new Set(list)
  const added: T[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    added.push(id)
  }
  return added.length === 0 ? list : [...list, ...added]
}

/** `list` without `id`. Returns `list` itself if `id` was not there. */
function without<T>(list: readonly T[], id: T): readonly T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : list
}

/** `record` with `key` set to `list`, dropping the key rather than keeping an empty list. */
function setList<T>(
  record: Readonly<Record<string, readonly T[]>>,
  key: string,
  list: readonly T[],
): Readonly<Record<string, readonly T[]>> {
  if (list.length > 0) return { ...record, [key]: list }
  return Object.fromEntries(Object.entries(record).filter(([existing]) => existing !== key))
}

function addMeal(plan: MealPlan, date: ISODate, meal: PlannedMeal): MealPlan {
  const day = plan[date] ?? []
  if (day.some((existing) => existing.id === meal.id)) return plan
  return setList(plan, date, [...day, meal])
}

/** `plan` without any meal of `recipeId`, dropping days left empty. */
function withoutRecipe(plan: MealPlan, recipeId: RecipeId): MealPlan {
  return Object.fromEntries(
    Object.entries(plan)
      .map(([date, meals]) => [date, meals.filter((meal) => meal.recipeId !== recipeId)] as const)
      .filter(([, meals]) => meals.length > 0),
  )
}

const withPlan = (state: AppState, plan: MealPlan): AppState => (plan === state.plan ? state : { ...state, plan })

const isFresh = (state: AppState) =>
  state.harvest.length === 0 &&
  state.larder.length === 0 &&
  Object.keys(state.plan).length === 0 &&
  Object.keys(state.shoppingTicks).length === 0 &&
  state.myRecipes.length === 0 &&
  state.myIngredients.length === 0

function apply(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'harvest/add': {
      const { ingredientId, status, glut, today } = action
      if (state.harvest.some((item) => item.ingredientId === ingredientId)) {
        return updateHarvestItem(state, ingredientId, status, glut)
      }
      return { ...state, harvest: [...state.harvest, { ingredientId, status, glut, addedOn: today }] }
    }
    case 'harvest/update':
      return updateHarvestItem(state, action.ingredientId, action.status, action.glut)
    case 'harvest/remove': {
      const harvest = state.harvest.filter((item) => item.ingredientId !== action.ingredientId)
      return harvest.length === state.harvest.length ? state : { ...state, harvest }
    }
    case 'larder/add': {
      const larder = addUnique(state.larder, action.ingredientIds)
      return larder === state.larder ? state : { ...state, larder }
    }
    case 'larder/remove': {
      const larder = without(state.larder, action.ingredientId)
      return larder === state.larder ? state : { ...state, larder }
    }
    case 'plan/add':
      return withPlan(state, addMeal(state.plan, action.date, action.meal))
    case 'plan/remove': {
      const day = state.plan[action.date] ?? []
      if (!day.some((meal) => meal.id === action.mealId)) return state
      return withPlan(state, setList(state.plan, action.date, day.filter((meal) => meal.id !== action.mealId)))
    }
    case 'plan/setCooked': {
      const { date, mealId, cooked } = action
      const day = state.plan[date] ?? []
      const target = day.find((meal) => meal.id === mealId)
      if (!target || target.cooked === cooked) return state
      const updated = day.map((meal) => (meal === target ? { ...meal, cooked } : meal))
      return withPlan(state, setList(state.plan, date, updated))
    }
    case 'plan/fill': {
      const plan = Object.entries(action.meals).reduce((acc, [date, meal]) => addMeal(acc, date, meal), state.plan)
      return withPlan(state, plan)
    }
    case 'shop/toggle': {
      const { weekStart, ingredientId } = action
      const ticks = state.shoppingTicks[weekStart] ?? []
      const toggled = ticks.includes(ingredientId) ? without(ticks, ingredientId) : [...ticks, ingredientId]
      return { ...state, shoppingTicks: setList(state.shoppingTicks, weekStart, toggled) }
    }
    case 'shop/moveTickedToLarder': {
      const ticks = state.shoppingTicks[action.weekStart] ?? []
      if (ticks.length === 0) return state
      return {
        ...state,
        larder: addUnique(state.larder, ticks),
        shoppingTicks: setList(state.shoppingTicks, action.weekStart, []),
      }
    }
    case 'myRecipes/save': {
      const { recipe } = action
      const index = state.myRecipes.findIndex((existing) => existing.id === recipe.id)
      if (index === -1) return { ...state, myRecipes: [...state.myRecipes, recipe] }
      if (state.myRecipes[index] === recipe) return state
      return { ...state, myRecipes: state.myRecipes.map((existing, i) => (i === index ? recipe : existing)) }
    }
    case 'myRecipes/remove': {
      const { recipeId } = action
      if (!state.myRecipes.some((recipe) => recipe.id === recipeId)) return state
      return {
        ...state,
        myRecipes: state.myRecipes.filter((recipe) => recipe.id !== recipeId),
        plan: withoutRecipe(state.plan, recipeId),
      }
    }
    case 'myIngredients/add': {
      const { ingredient } = action
      if (state.myIngredients.some((existing) => existing.id === ingredient.id)) return state
      return { ...state, myIngredients: [...state.myIngredients, ingredient] }
    }
    case 'state/replace':
      return action.state
    case 'state/reset':
      return isFresh(state) ? state : initialState()
    default:
      return state
  }
}

/**
 * The app's only way to change state. Pure: never mutates `state`, and
 * returns `state` itself when an action changes nothing.
 *
 * A change that would fail `appStateSchema` (a bad date, an over-long title,
 * a list past its cap) is refused and `state` is returned, because saving it
 * would make the whole state unloadable next time. Forms should check input
 * against LIMITS and `myRecipeSchema` / `myIngredientSchema` first.
 */
export function reducer(state: AppState, action: Action): AppState {
  const next = apply(state, action)
  return next === state || isValidState(next) ? next : state
}
