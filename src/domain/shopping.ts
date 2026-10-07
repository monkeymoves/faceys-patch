import { AISLE_LABELS } from './aisles'
import { findRecipe, haveChecker, type Supplies } from './catalogue'
import { weekDates } from './dates'
import {
  AISLES,
  type Ingredient,
  type IngredientId,
  type ISODate,
  type MealPlan,
  type RecipeId,
  type ShoppingItem,
} from './types'

export interface ShoppingListInput extends Supplies {
  plan: MealPlan
  shoppingTicks: Readonly<Record<ISODate, readonly IngredientId[]>>
  /** The Monday that starts the week. */
  weekStart: ISODate
}

const aisleOrder = (item: ShoppingItem) => AISLES.indexOf(item.aisle)

/**
 * Everything the week's uncooked meals need that you don't have, merged by
 * ingredient, sorted by aisle then name.
 */
export function buildShoppingList(input: ShoppingListInput): ShoppingItem[] {
  const { catalogue, plan, shoppingTicks, weekStart } = input
  const have = haveChecker(input)
  const ticked = new Set(shoppingTicks[weekStart] ?? [])
  const needed = new Map<IngredientId, { ingredient: Ingredient; forRecipes: RecipeId[] }>()

  for (const date of weekDates(weekStart)) {
    for (const meal of plan[date] ?? []) {
      if (meal.cooked) continue
      for (const { id, optional } of findRecipe(catalogue, meal.recipeId)?.ingredients ?? []) {
        const ingredient = catalogue.ingredients.get(id)
        if (!ingredient || optional || have(id)) continue
        const entry = needed.get(id) ?? { ingredient, forRecipes: [] }
        if (!entry.forRecipes.includes(meal.recipeId)) entry.forRecipes.push(meal.recipeId)
        needed.set(id, entry)
      }
    }
  }

  return [...needed.values()]
    .map(({ ingredient, forRecipes }) => ({
      ingredientId: ingredient.id,
      name: ingredient.name,
      aisle: ingredient.aisle,
      forRecipes,
      ticked: ticked.has(ingredient.id),
    }))
    .sort((a, b) => aisleOrder(a) - aisleOrder(b) || a.name.localeCompare(b.name, 'en-GB'))
}

/**
 * The list as plain text for sharing: the heading, then each aisle (in
 * AISLES order) with its unticked items as '- Name' lines.
 */
export function shoppingListText(items: readonly ShoppingItem[], heading: string): string {
  const sections = AISLES.flatMap((aisle) => {
    const names = items.filter((item) => item.aisle === aisle && !item.ticked).map((item) => `- ${item.name}`)
    return names.length > 0 ? [[AISLE_LABELS[aisle], ...names].join('\n')] : []
  })
  return [heading, ...sections].join('\n\n')
}
