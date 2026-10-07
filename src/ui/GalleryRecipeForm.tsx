/* Dev-only: a composed "Write a recipe" form in a Sheet, to judge the form primitives together. */
import { useState } from 'react'
import type { ArtKey, Course } from '../domain/types'
import { Button } from './Button'
import { FieldGroup } from './FieldGroup'
import { IngredientRow } from './IngredientRow'
import { NumberStepper } from './NumberStepper'
import { SearchField } from './SearchField'
import { Select } from './Select'
import { Sheet } from './Sheet'
import { TextArea } from './TextArea'
import { TextField } from './TextField'
import styles from './Gallery.module.css'

interface Row {
  id: string
  name: string
  art?: ArtKey
  amount: string
  optional: boolean
}

const COURSES: readonly { value: Course; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'side', label: 'Side' },
  { value: 'soup', label: 'Soup' },
  { value: 'salad', label: 'Salad' },
  { value: 'pudding', label: 'Pudding' },
  { value: 'preserve', label: 'Preserve' },
  { value: 'bake', label: 'Bake' },
]

export function RecipeFormSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Write a recipe"
      footer={
        <>
          <Button onClick={onClose}>Save recipe</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <RecipeForm />
    </Sheet>
  )
}

function RecipeForm() {
  const [title, setTitle] = useState('Nan Facey’s courgette chutney')
  const [note, setNote] = useState('')
  const [minutes, setMinutes] = useState(90)
  const [serves, setServes] = useState(6)
  const [course, setCourse] = useState<Course>('preserve')
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState(
    'Chop the courgettes and onions small.\nPut everything in a big pan and bring to the boil.\nSimmer for an hour, stirring now and then, until thick.',
  )
  const [rows, setRows] = useState<Row[]>([
    { id: 'a', name: 'Courgettes', art: 'courgette', amount: '1kg', optional: false },
    { id: 'b', name: 'Onions', art: 'onion', amount: '2 big ones', optional: false },
    { id: 'c', name: 'Sultanas', amount: 'a handful', optional: true },
  ])
  const update = (id: string, patch: Partial<Row>) =>
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <TextField label="Title" value={title} onChange={setTitle} maxLength={60} required data-autofocus />
      <TextArea
        label="Short note"
        optional
        hint="One line about it, for the recipe card."
        value={note}
        onChange={setNote}
        maxLength={140}
        rows={2}
      />
      <div className={styles.formPair}>
        <NumberStepper label="Minutes" value={minutes} onChange={setMinutes} min={5} max={600} step={5} unit="min" />
        <NumberStepper label="Serves" value={serves} onChange={setServes} min={1} max={20} />
      </div>
      <Select label="Course" options={COURSES} value={course} onChange={setCourse} />
      <FieldGroup legend="Ingredients" hint="Salt, pepper and water are taken as read.">
        {rows.map((row) => (
          <IngredientRow
            key={row.id}
            name={row.name}
            art={row.art}
            amount={row.amount}
            optional={row.optional}
            onAmountChange={(amount) => update(row.id, { amount })}
            onOptionalChange={(optional) => update(row.id, { optional })}
            onRemove={() => setRows((all) => all.filter((r) => r.id !== row.id))}
          />
        ))}
        <SearchField label="Add an ingredient" value={search} onChange={setSearch} placeholder="Start typing, e.g. vinegar" />
        <div>
          <Button variant="ghost" icon="plus" size="sm">
            Not on the list?
          </Button>
        </div>
      </FieldGroup>
      <TextArea label="Method" hint="One step per line." value={method} onChange={setMethod} rows={4} />
    </form>
  )
}
