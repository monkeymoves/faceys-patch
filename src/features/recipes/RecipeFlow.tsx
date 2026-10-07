import { makeMealId } from '../../app/ids'
import { useStore } from '../../app/useStore'
import { findRecipe, formatLongDate, type ISODate, type RecipeId } from '../../domain'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { DayPickerSheet } from './DayPickerSheet'
import { RecipeFormSheet } from './RecipeFormSheet'
import { RecipeViewSheet } from './RecipeViewSheet'

/** A meal on the plan, so the recipe view can offer "Mark as cooked" and "Take off this day". */
export interface PlannedMealRef {
  date: ISODate
  mealId: string
}

/**
 * What's open. The recipe view sits underneath; the day picker, the form and
 * the delete confirm open on top of it (or, for a new recipe, on their own).
 * `null` means everything is closed.
 */
export interface RecipeFlowState {
  recipeId?: RecipeId
  meal?: PlannedMealRef
  /** A short confirmation shown in the recipe view. */
  notice?: string
  top?: 'days' | 'edit' | 'copy' | 'delete' | 'new'
}

export interface RecipeFlowProps {
  flow: RecipeFlowState | null
  onFlowChange: (flow: RecipeFlowState | null) => void
}

/**
 * Everything to do with one recipe: view it, add it to a day, write, edit,
 * copy or delete it. Screens hold the state and open it with
 * `{ recipeId }`, `{ recipeId, meal }` or `{ top: 'new' }`.
 */
export function RecipeFlow({ flow, onFlowChange }: RecipeFlowProps) {
  const { state, dispatch, catalogue } = useStore()
  const recipe = flow?.recipeId ? findRecipe(catalogue, flow.recipeId) : undefined
  const mine = recipe !== undefined && state.myRecipes.some((own) => own.id === recipe.id)
  const mealRef = flow?.meal
  const meal = mealRef && (state.plan[mealRef.date] ?? []).find((planned) => planned.id === mealRef.mealId)
  const top = flow?.top

  /** Back to the recipe view, or close everything if there isn't one. */
  const back = () => onFlowChange(recipe && flow ? { ...flow, top: undefined } : null)
  const closeAll = () => onFlowChange(null)
  const openTop = (next: RecipeFlowState['top']) => {
    if (flow) onFlowChange({ ...flow, top: next, notice: undefined })
  }

  const formMode = top === 'new' || top === 'edit' || top === 'copy' ? top : 'new'
  const formOpen = top === 'new' || ((top === 'edit' || top === 'copy') && recipe !== undefined)

  // Overlays come first, so that when one closes and the view opens in the same
  // update (saving a new recipe), the closing one hands focus back first.
  return (
    <>
      <RecipeFormSheet
        open={formOpen}
        mode={formMode}
        recipe={recipe}
        onClose={back}
        onSaved={(recipeId) => onFlowChange({ recipeId, meal: formMode === 'edit' ? mealRef : undefined })}
      />
      <DayPickerSheet
        open={top === 'days' && recipe !== undefined}
        recipeTitle={recipe?.title ?? ''}
        onClose={back}
        onPick={(date) => {
          if (!recipe || !flow) return
          dispatch({ type: 'plan/add', date, meal: { id: makeMealId(), recipeId: recipe.id, cooked: false } })
          onFlowChange({ ...flow, top: undefined, notice: `Added to ${formatLongDate(date)}.` })
        }}
      />
      <ConfirmDialog
        open={top === 'delete' && mine}
        title="Delete this recipe?"
        message={<p>{recipe?.title} will be gone for good. It's also taken off any days it's planned for.</p>}
        confirmLabel="Delete recipe"
        destructive
        onConfirm={() => {
          if (recipe) dispatch({ type: 'myRecipes/remove', recipeId: recipe.id })
          closeAll()
        }}
        onCancel={back}
      />
      <RecipeViewSheet
        recipe={top === 'new' ? undefined : recipe}
        mine={mine}
        meal={meal && mealRef ? { date: mealRef.date, cooked: meal.cooked } : undefined}
        notice={flow?.notice}
        onClose={closeAll}
        onAddToWeek={() => openTop('days')}
        onEdit={() => openTop('edit')}
        onCopy={() => openTop('copy')}
        onDelete={() => openTop('delete')}
        onSetCooked={(cooked) => {
          if (!mealRef) return
          dispatch({ type: 'plan/setCooked', date: mealRef.date, mealId: mealRef.mealId, cooked })
          closeAll()
        }}
        onTakeOff={() => {
          if (!mealRef) return
          dispatch({ type: 'plan/remove', date: mealRef.date, mealId: mealRef.mealId })
          closeAll()
        }}
      />
    </>
  )
}
