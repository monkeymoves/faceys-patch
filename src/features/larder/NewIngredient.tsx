import { useId, useState, type FormEvent } from 'react'
import { useStore } from '../../app/useStore'
import {
  AISLE_LABELS,
  AISLES,
  LIMITS,
  makeMyId,
  myIngredientSchema,
  type Aisle,
  type Ingredient,
} from '../../domain'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'
import { sameName } from './stock'
import styles from './Larder.module.css'

const AISLE_OPTIONS = AISLES.map((aisle) => ({ value: aisle, label: AISLE_LABELS[aisle] }))

/** "Not on the list?": the person's own ingredient, straight into the larder. */
export function NewIngredient() {
  const { state, dispatch, catalogue } = useStore()
  const [name, setName] = useState('')
  const [aisle, setAisle] = useState<Aisle>('dry-goods')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const headingId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setError('Give it a name first.')
      return
    }

    // Already on the list under that name: use it rather than making a twin.
    const existing = [...catalogue.ingredients.values()].find((ingredient) => sameName(ingredient.name, trimmed))
    if (existing?.assumed) {
      finish(`No need: ${existing.name.toLocaleLowerCase('en-GB')} is always counted as there.`)
      return
    }
    if (existing) {
      dispatch({ type: 'larder/add', ingredientIds: [existing.id] })
      finish(`${existing.name} is in the larder.`)
      return
    }

    if (state.myIngredients.length >= LIMITS.myIngredients) {
      setError("You've added as many of your own as the app can hold.")
      return
    }
    const parsed = myIngredientSchema.safeParse({
      id: makeMyId(trimmed),
      name: trimmed,
      aisle,
      growable: false,
    } satisfies Ingredient)
    if (!parsed.success) {
      setError("That name won't work. Try a shorter one.")
      return
    }
    dispatch({ type: 'myIngredients/add', ingredient: parsed.data })
    dispatch({ type: 'larder/add', ingredientIds: [parsed.data.id] })
    finish(`${trimmed} is in the larder.`)
  }

  function finish(message: string) {
    setName('')
    setError('')
    setDone(message)
  }

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId} className={styles.heading}>
        Not on the list?
      </h2>
      <p className={styles.note}>Add your own and it goes straight in the larder.</p>
      <form className={styles.newForm} onSubmit={submit} noValidate>
        <TextField
          label="Name"
          value={name}
          onChange={(next) => {
            setName(next)
            setError('')
            setDone('')
          }}
          error={error || undefined}
          maxLength={LIMITS.nameLength}
          autoComplete="off"
          placeholder="e.g. Za'atar"
        />
        <Select
          label="Aisle"
          options={AISLE_OPTIONS}
          value={aisle}
          onChange={(next) => {
            setAisle(next)
            setDone('')
          }}
        />
        <Button type="submit" variant="secondary" icon="plus" className={styles.newSubmit}>
          Add to larder
        </Button>
      </form>
      {done && <Notice tone="success">{done}</Notice>}
    </section>
  )
}
