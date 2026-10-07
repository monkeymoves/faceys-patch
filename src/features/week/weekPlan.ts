import {
  addDays,
  findRecipe,
  formatLongDate,
  hasKnownMeals,
  parseISODate,
  toISODate,
  weekDates,
  type ArtKey,
  type Catalogue,
  type HarvestItem,
  type ISODate,
  type MealPlan,
  type PlannedMeal,
} from '../../domain'

export type FillState = { canFill: true; dates: ISODate[]; hint: string } | { canFill: false; reason: string }

/**
 * Which days "Fill my week" would plan: the empty ones from today onwards, or
 * every empty day in a week that hasn't started. Never a week that's over. A
 * day holding only a recipe that has since gone counts as empty.
 */
export function fillState(weekStart: ISODate, today: ISODate, plan: MealPlan, catalogue: Catalogue): FillState {
  const dates = weekDates(weekStart)
  const started = weekStart <= today
  const remaining = dates.filter((date) => date >= today)
  if (remaining.length === 0) return { canFill: false, reason: "This week's been and gone." }
  const empty = remaining.filter((date) => !hasKnownMeals(plan, date, catalogue))
  if (empty.length === 0) {
    return {
      canFill: false,
      reason: started ? 'Every day from today already has a meal.' : 'Every day already has a meal.',
    }
  }
  return {
    canFill: true,
    dates: empty,
    hint: started
      ? "Plans a dinner for each empty day from today, using what's ready."
      : "Plans a dinner for each empty day, using what's ready.",
  }
}

export interface FillOutcome {
  tone: 'success' | 'info'
  text: string
  /** Nothing could be planned because the patch is empty. */
  toPatch?: boolean
}

/** What to tell the person after "Fill my week". */
export function fillOutcome(planned: number, wanted: number, patchEmpty: boolean): FillOutcome {
  if (planned === 0) {
    return patchEmpty
      ? {
          tone: 'info',
          text: "There's nothing on the patch yet, so nothing to plan from. Add what's ready first.",
          toPatch: true,
        }
      : {
          tone: 'info',
          text: "No more dinners to suggest from what's on the patch. Add one by hand, or write a recipe.",
        }
  }
  const dinners = `${planned} ${planned === 1 ? 'dinner' : 'dinners'}`
  return {
    tone: 'success',
    text:
      planned < wanted
        ? `Planned ${dinners} from what's ready. That's all the ideas for now.`
        : `Planned ${dinners} from what's ready.`,
  }
}

export interface MonthRef {
  year: number
  /** 1 to 12 */
  month: number
}

/** The month to show for a week: today's month if the week holds today, otherwise the month of its Thursday. */
export function monthOfWeek(weekStart: ISODate, today: ISODate): MonthRef {
  const dates = weekDates(weekStart)
  const anchor = parseISODate(dates.includes(today) ? today : addDays(weekStart, 3))
  return { year: anchor.getFullYear(), month: anchor.getMonth() + 1 }
}

export function shiftMonth({ year, month }: MonthRef, by: number): MonthRef {
  const index = year * 12 + (month - 1) + by
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function firstOfMonth({ year, month }: MonthRef): ISODate {
  return toISODate(new Date(year, month - 1, 1))
}

/**
 * A drawing for a planned day: a patch veg from its first meal, else any
 * growable thing in that recipe, else nothing (the caller draws a plain mark).
 */
export function dayArt(
  meals: readonly PlannedMeal[],
  catalogue: Catalogue,
  harvest: readonly HarvestItem[],
): ArtKey | undefined {
  const [first] = meals
  const recipe = first && findRecipe(catalogue, first.recipeId)
  if (!recipe) return undefined
  const onPatch = new Set(harvest.map((item) => item.ingredientId))
  const drawn = recipe.ingredients.flatMap((item) => {
    const ingredient = catalogue.ingredients.get(item.id)
    return ingredient?.art ? [{ art: ingredient.art, patch: onPatch.has(item.id) }] : []
  })
  return (drawn.find((entry) => entry.patch) ?? drawn[0])?.art
}

/** 'Wednesday 7 October, today, 1 meal planned' */
export function monthDayLabel(date: ISODate, today: ISODate, mealCount: number): string {
  const planned = mealCount === 0 ? 'nothing planned' : `${mealCount} ${mealCount === 1 ? 'meal' : 'meals'} planned`
  return [formatLongDate(date), date === today ? 'today' : '', planned].filter(Boolean).join(', ')
}

/** 'Monday' from a date. */
export function dayName(date: ISODate): string {
  return formatLongDate(date).split(' ')[0] ?? ''
}
