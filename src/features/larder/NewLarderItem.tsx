import { useId, useRef, useState, type FormEvent } from 'react'
import { useStore } from '../../app/useStore'
import { LIMITS, type Aisle } from '../../domain'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'
import { AISLE_OPTIONS, findOrMakeIngredient } from '../shared/ingredients'
import { addedToLarder, alwaysThere } from './stock'
import styles from './Larder.module.css'

export interface NewLarderItemProps {
  /** Reads the outcome out, through the screen's Announcer. */
  announce: (text: string) => void
}

/** "Not on the list?": anything typed goes straight in the larder, reusing a name already known. */
export function NewLarderItem({ announce }: NewLarderItemProps) {
  const { state, dispatch, catalogue } = useStore()
  const [name, setName] = useState('')
  const [aisle, setAisle] = useState<Aisle>('dry-goods')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const headingId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = findOrMakeIngredient(catalogue, { name, aisle, grows: false }, state.myIngredients.length)
    if (!result.ok) {
      setError(result.error)
      setDone('')
      // The message is tied to the field, so it's read out with it.
      nameField.current?.focus()
      return
    }
    const { ingredient, isNew } = result
    if (isNew) dispatch({ type: 'myIngredients/add', ingredient })
    if (!ingredient.assumed) dispatch({ type: 'larder/add', ingredientIds: [ingredient.id] })
    const message = ingredient.assumed ? alwaysThere(ingredient.name) : addedToLarder(ingredient.name)
    setName('')
    setError('')
    setDone(message)
    announce(message)
  }

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId} className={styles.heading}>
        Not on the list?
      </h2>
      <p className={styles.note}>Add your own and it goes straight in the larder.</p>
      <form className={styles.newForm} onSubmit={submit} noValidate>
        <TextField
          ref={nameField}
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
          Add to the larder
        </Button>
      </form>
      {done && (
        <Notice tone="success" live={false}>
          {done}
        </Notice>
      )}
    </section>
  )
}
