/** The domain layer's public API for the UI. Pure TypeScript: no React, no DOM, no src/data. */
export * from './types'
export { AISLE_LABELS } from './aisles'
export {
  buildAlmanac,
  CROP_ACTIVITIES,
  cropCalendar,
  cropYear,
  groupJobsByKind,
  growableCrops,
  hasActivity,
  hiddenJobs,
  jobsForMonth,
  jobsToDo,
  sowingForMonth,
  type CropActivity,
  type CropCalendarEntry,
  type CropYear,
  type JobGroup,
  type JobsInput,
  type JobView,
  type MonthSowing,
} from './almanac'
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
  firstOfMonth,
  formatLongDate,
  formatMonthLabel,
  formatMonths,
  formatShortDay,
  formatWeekRange,
  isISODate,
  isISOMonth,
  isSameMonth,
  monthGrid,
  monthKey,
  monthKeyOf,
  monthName,
  monthRefOf,
  parseISODate,
  shiftMonth,
  startOfWeek,
  toISODate,
  todayISO,
  weekDates,
  type MonthRef,
} from './dates'
export { makeMyId } from './ids'
export { matchRecipes } from './matching'
export { hasKnownMeals, knownMeals, PLANNABLE_COURSES, planWeek, type PlanWeekInput } from './planner'
export { LIMITS, appStateSchema, isValidState, myIngredientSchema, myJobSchema, myRecipeSchema } from './schema'
export { buildShoppingList, shoppingListText, type ShoppingListInput } from './shopping'
export { initialState, reducer, type Action } from './state'
export {
  BACKUP_ERRORS,
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
