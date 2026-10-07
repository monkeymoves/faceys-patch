/** The domain layer's public API for the UI. Pure TypeScript: no React, no DOM, no src/data. */
export * from './types'
export { AISLE_LABELS } from './aisles'
export {
  buildCatalogue,
  deriveDiet,
  findRecipe,
  hasIngredient,
  withMyContent,
  type Supplies,
} from './catalogue'
export {
  addDays,
  formatLongDate,
  formatMonthLabel,
  formatShortDay,
  formatWeekRange,
  isISODate,
  isSameMonth,
  monthGrid,
  parseISODate,
  startOfWeek,
  toISODate,
  todayISO,
  weekDates,
} from './dates'
export { makeMyId } from './ids'
export { matchRecipes } from './matching'
export { PLANNABLE_COURSES, planWeek, type PlanWeekInput } from './planner'
export { LIMITS, appStateSchema, isValidState, myIngredientSchema, myRecipeSchema } from './schema'
export { buildShoppingList, shoppingListText, type ShoppingListInput } from './shopping'
export { initialState, reducer, type Action } from './state'
export {
  MAX_BACKUP_BYTES,
  STORAGE_KEY,
  loadState,
  parseBackup,
  saveState,
  serializeBackup,
  type BackupProblem,
  type KeyValueStorage,
  type LoadNotice,
  type LoadResult,
  type ParseBackupResult,
  type SaveResult,
} from './storage'
