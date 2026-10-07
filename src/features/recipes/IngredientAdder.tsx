import { useId, useState, type KeyboardEvent } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { AISLE_LABELS, AISLES, LIMITS, type Aisle, type Ingredient, type IngredientId } from '../../domain'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { Icon } from '../../ui/icons'
import { SearchField } from '../../ui/SearchField'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'
import { findByName, makeIngredient, searchIngredients } from './recipeForm'
import styles from './RecipeForm.module.css'

const AISLE_OPTIONS = AISLES.map((aisle) => ({ value: aisle, label: AISLE_LABELS[aisle] }))

export interface IngredientAdderProps {
  /** Ingredients already in the recipe, left out of the results. */
  chosen: ReadonlySet<IngredientId>
  onAdd: (ingredient: Ingredient) => void
  /** Marks the search box as the place to fix "Add at least one ingredient". */
  invalid?: boolean
}

/** Search the ingredient list to add one, or make a new one with "Not on the list?". */
export function IngredientAdder({ chosen, onAdd, invalid = false }: IngredientAdderProps) {
  const { catalogue } = useStore()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const results = searchIngredients(catalogue, query, chosen)

  function add(ingredient: Ingredient) {
    setQuery('')
    setCreating(false)
    onAdd(ingredient)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const [first] = results
    if (first) add(first)
  }

  return (
    <div className={styles.adder}>
      <SearchField
        label="Add an ingredient"
        value={query}
        onChange={setQuery}
        placeholder="Start typing, e.g. vinegar"
        onKeyDown={onSearchKeyDown}
        aria-invalid={invalid ? true : undefined}
        data-ingredient-search=""
      />
      <div>
        {query.trim() !== '' &&
          (results.length > 0 ? (
            <ul role="list" className={styles.results}>
              {results.map((ingredient) => (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    className={styles.result}
                    aria-label={`Add ${ingredient.name}`}
                    onClick={() => add(ingredient)}
                  >
                    <Icon name="plus" size={20} className={styles.resultPlus} />
                    <span className={styles.resultArt} aria-hidden="true">
                      {ingredient.art && <Art name={ingredient.art} size={30} />}
                    </span>
                    <span>{ingredient.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>Nothing called “{query.trim()}” on the list.</p>
          ))}
      </div>
      {creating ? (
        <NewIngredient
          startName={query}
          onCancel={() => setCreating(false)}
          onMade={(ingredient) => {
            if (chosen.has(ingredient.id)) {
              setQuery('')
              setCreating(false)
            } else {
              add(ingredient)
            }
          }}
        />
      ) : (
        <div>
          <Button variant="ghost" size="sm" icon="plus" onClick={() => setCreating(true)}>
            Not on the list?
          </Button>
        </div>
      )}
    </div>
  )
}

const capitalise = (text: string) => text.charAt(0).toLocaleUpperCase('en-GB') + text.slice(1)

interface NewIngredientProps {
  startName: string
  onCancel: () => void
  onMade: (ingredient: Ingredient) => void
}

/** A small inline form for an ingredient of the person's own. */
function NewIngredient({ startName, onCancel, onMade }: NewIngredientProps) {
  const { state, dispatch, catalogue } = useStore()
  const [name, setName] = useState(() => capitalise(startName.trim()))
  const [aisle, setAisle] = useState<Aisle>('veg')
  const [grows, setGrows] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const headingId = useId()

  function make() {
    const existing = findByName(catalogue, name)
    if (existing) {
      onMade(existing)
      return
    }
    const result = makeIngredient({ name, aisle, grows }, state.myIngredients.length)
    if (!result.ok) {
      setError(result.error)
      return
    }
    dispatch({ type: 'myIngredients/add', ingredient: result.ingredient })
    onMade(result.ingredient)
  }

  return (
    <div role="group" aria-labelledby={headingId} className={styles.newIngredient}>
      <h3 id={headingId} className={styles.newHeading}>
        A new ingredient
      </h3>
      <TextField
        label="Ingredient name"
        value={name}
        onChange={(value) => {
          setName(value)
          setError(undefined)
        }}
        maxLength={LIMITS.nameLength}
        error={error}
        autoComplete="off"
        autoFocus
      />
      <Select label="Aisle" options={AISLE_OPTIONS} value={aisle} onChange={setAisle} />
      <Checkbox label="I grow this" hint="So you can add it to your patch" checked={grows} onCheckedChange={setGrows} />
      <div className={styles.newActions}>
        <Button size="sm" onClick={make}>
          Add it
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
