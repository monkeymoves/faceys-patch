import { describe, expect, it } from 'vitest'
import * as domain from './index'

describe('domain public API', () => {
  it('exposes every function and constant the UI builds against', () => {
    const functions = [
      'addDays',
      'buildCatalogue',
      'buildShoppingList',
      'deriveDiet',
      'findRecipe',
      'formatLongDate',
      'formatMonthLabel',
      'formatShortDay',
      'formatWeekRange',
      'hasIngredient',
      'initialState',
      'isISODate',
      'isSameMonth',
      'isValidState',
      'loadState',
      'makeMyId',
      'matchRecipes',
      'monthGrid',
      'parseBackup',
      'parseISODate',
      'planWeek',
      'reducer',
      'saveState',
      'serializeBackup',
      'shoppingListText',
      'startOfWeek',
      'toISODate',
      'todayISO',
      'weekDates',
      'withMyContent',
    ]
    for (const name of functions) expect(typeof domain[name as keyof typeof domain], name).toBe('function')
    expect(domain.STORAGE_KEY).toBe('faceys-patch.v1')
    expect(domain.MAX_BACKUP_BYTES).toBe(1_000_000)
    expect(domain.AISLE_LABELS['tins-jars']).toBe('Tins and jars')
    expect(domain.MY_ID_PREFIX).toBe('my-')
    expect(domain.AISLES).toContain('veg')
    expect(domain.LIMITS.titleLength).toBe(80)
    expect(domain.appStateSchema.safeParse(domain.initialState()).success).toBe(true)
    expect(domain.myRecipeSchema).toBeDefined()
    expect(domain.myIngredientSchema).toBeDefined()
  })
})
