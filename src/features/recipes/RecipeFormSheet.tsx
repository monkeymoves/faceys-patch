import { useEffect, useRef, useState, type RefObject } from 'react'
import { useStore } from '../../app/useStore'
import { LIMITS, makeMyId, type Ingredient, type IngredientId, type Recipe, type RecipeId } from '../../domain'
import { Button } from '../../ui/Button'
import { FieldGroup } from '../../ui/FieldGroup'
import { IngredientRow } from '../../ui/IngredientRow'
import { NumberStepper } from '../../ui/NumberStepper'
import { Select } from '../../ui/Select'
import { Sheet } from '../../ui/Sheet'
import { TextArea } from '../../ui/TextArea'
import { TextField } from '../../ui/TextField'
import { IngredientAdder } from './IngredientAdder'
import {
  checkDraft,
  COURSE_OPTIONS,
  draftFromRecipe,
  emptyDraft,
  MINUTES_RANGE,
  type DraftErrors,
  type DraftField,
  type DraftRow,
  type RecipeDraft,
} from './recipeForm'
import styles from './RecipeForm.module.css'

export type RecipeFormMode = 'new' | 'edit' | 'copy'

const TITLES: Record<RecipeFormMode, string> = {
  new: 'Write a recipe',
  edit: 'Edit recipe',
  copy: 'Make it your own',
}

export interface RecipeFormSheetProps {
  open: boolean
  mode: RecipeFormMode
  /** The recipe to edit or copy. Ignored for a new one. */
  recipe?: Recipe
  onClose: () => void
  onSaved: (recipeId: RecipeId) => void
}

function startingDraft(mode: RecipeFormMode, recipe: Recipe | undefined): RecipeDraft {
  return recipe && mode !== 'new' ? draftFromRecipe(recipe, mode === 'copy') : emptyDraft()
}

/** Write, edit or copy a recipe. Nothing is saved until it passes every check. */
export function RecipeFormSheet({ open, mode, recipe, onClose, onSaved }: RecipeFormSheetProps) {
  const { state, dispatch, catalogue } = useStore()
  const [draft, setDraft] = useState(() => startingDraft(mode, recipe))
  const [errors, setErrors] = useState<DraftErrors>({})
  const [wasOpen, setWasOpen] = useState(open)
  const [attempts, setAttempts] = useState(0)
  const [focusRow, setFocusRow] = useState<IngredientId | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Start afresh each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(startingDraft(mode, recipe))
      setErrors({})
      setFocusRow(null)
    }
  }

  // After a failed save, take the person to the first thing to fix.
  useEffect(() => {
    if (attempts === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [attempts])

  // After adding an ingredient, put the cursor in its amount.
  useEffect(() => {
    if (!focusRow) return
    formRef.current?.querySelector<HTMLElement>(`[data-row="${focusRow}"] input[type="text"]`)?.focus()
  }, [focusRow])

  function change<K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K], field?: DraftField) {
    setDraft((current) => ({ ...current, [key]: value }))
    if (field && errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function updateRow(id: IngredientId, patch: Partial<DraftRow>) {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }))
  }

  function addRow(ingredient: Ingredient) {
    setDraft((current) => ({
      ...current,
      rows: [...current.rows, { id: ingredient.id, amount: '', optional: false }],
    }))
    setErrors((current) => ({ ...current, ingredients: undefined }))
    setFocusRow(ingredient.id)
  }

  function removeRow(id: IngredientId) {
    setDraft((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== id) }))
    setFocusRow(null)
    formRef.current?.querySelector<HTMLElement>('[data-ingredient-search]')?.focus()
  }

  function save() {
    const editing = mode === 'edit' && recipe !== undefined
    if (!editing && state.myRecipes.length >= LIMITS.myRecipes) {
      setErrors({ title: "You've written as many recipes as the app can keep" })
      setAttempts((count) => count + 1)
      return
    }
    const id = editing ? recipe.id : makeMyId(draft.title.trim() || 'recipe')
    const result = checkDraft(draft, id, catalogue)
    if (!result.ok) {
      setErrors(result.errors)
      setAttempts((count) => count + 1)
      return
    }
    dispatch({ type: 'myRecipes/save', recipe: result.recipe })
    onSaved(result.recipe.id)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={TITLES[mode]}
      footer={
        <>
          <Button onClick={save}>Save recipe</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <RecipeFields
        formRef={formRef}
        draft={draft}
        errors={errors}
        onChange={change}
        onSave={save}
        onAddRow={addRow}
        onUpdateRow={updateRow}
        onRemoveRow={removeRow}
        autoFocusTitle={mode === 'new'}
      />
    </Sheet>
  )
}

interface RecipeFieldsProps {
  formRef: RefObject<HTMLFormElement | null>
  draft: RecipeDraft
  errors: DraftErrors
  onChange: <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K], field?: DraftField) => void
  onSave: () => void
  onAddRow: (ingredient: Ingredient) => void
  onUpdateRow: (id: IngredientId, patch: Partial<DraftRow>) => void
  onRemoveRow: (id: IngredientId) => void
  autoFocusTitle: boolean
}

function RecipeFields({
  formRef,
  draft,
  errors,
  onChange,
  onSave,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  autoFocusTitle,
}: RecipeFieldsProps) {
  const { catalogue } = useStore()
  const chosen = new Set(draft.rows.map((row) => row.id))

  return (
    <form
      ref={formRef}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
      onKeyDown={(event) => {
        // Enter in a single-line field shouldn't save half a recipe.
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault()
      }}
    >
      <TextField
        label="Title"
        value={draft.title}
        onChange={(value) => onChange('title', value, 'title')}
        maxLength={LIMITS.titleLength}
        error={errors.title}
        autoComplete="off"
        data-autofocus={autoFocusTitle ? '' : undefined}
      />
      <TextArea
        label="Short note"
        optional
        hint="One line about it, for the recipe card."
        value={draft.note}
        onChange={(value) => onChange('note', value, 'note')}
        maxLength={LIMITS.blurbLength}
        error={errors.note}
        rows={2}
      />
      <div className={styles.pair}>
        <NumberStepper
          label="Minutes"
          unit="min"
          value={draft.minutes}
          onChange={(value) => onChange('minutes', value, 'minutes')}
          min={MINUTES_RANGE.min}
          max={MINUTES_RANGE.max}
          step={MINUTES_RANGE.step}
          error={errors.minutes}
        />
        <NumberStepper
          label="Serves"
          value={draft.serves}
          onChange={(value) => onChange('serves', value, 'serves')}
          min={1}
          max={LIMITS.serves}
          error={errors.serves}
        />
      </div>
      <Select
        label="Course"
        options={COURSE_OPTIONS}
        value={draft.course}
        onChange={(value) => onChange('course', value, 'course')}
        error={errors.course}
      />
      <FieldGroup legend="Ingredients" hint="Salt, pepper and water are taken as read." error={errors.ingredients}>
        {draft.rows.map((row) => {
          const ingredient = catalogue.ingredients.get(row.id)
          const name = ingredient?.name ?? row.id
          return (
            <div key={row.id} data-row={row.id}>
              <IngredientRow
                name={name}
                art={ingredient?.art}
                amount={row.amount}
                onAmountChange={(amount) => onUpdateRow(row.id, { amount })}
                optional={row.optional}
                onOptionalChange={(optional) => onUpdateRow(row.id, { optional })}
                onRemove={() => onRemoveRow(row.id)}
              />
            </div>
          )
        })}
        {draft.rows.length < LIMITS.recipeIngredients ? (
          <IngredientAdder chosen={chosen} onAdd={onAddRow} invalid={errors.ingredients !== undefined} />
        ) : (
          <p className={styles.full}>That's the most ingredients a recipe can have.</p>
        )}
      </FieldGroup>
      <TextArea
        label="Method"
        hint="One step per line."
        value={draft.method}
        onChange={(value) => onChange('method', value, 'method')}
        maxLength={LIMITS.steps * (LIMITS.stepLength + 1)}
        error={errors.method}
        rows={5}
      />
    </form>
  )
}
