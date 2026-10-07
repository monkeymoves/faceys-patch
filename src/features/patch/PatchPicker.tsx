import { useId, useState, type FormEvent } from 'react'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import {
  LIMITS,
  makeMyId,
  myIngredientSchema,
  type HarvestStatus,
  type Ingredient,
  type IngredientId,
} from '../../domain'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'
import { SearchField } from '../../ui/SearchField'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Sheet } from '../../ui/Sheet'
import { TextField } from '../../ui/TextField'
import { ToggleChip } from '../../ui/ToggleChip'
import { growables, inSeason, matchesQuery, monthName, monthOf, STATUS_OPTIONS } from './crops'
import styles from './Patch.module.css'

export interface PatchPickerProps {
  open: boolean
  onClose: () => void
}

/** "Add" on the Patch: tap crops on and off, then Done. Changes save as you go. */
export function PatchPicker({ open, onClose }: PatchPickerProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add to the patch"
      footer={
        <Button fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <PickerBody />
    </Sheet>
  )
}

function PickerBody() {
  const { state, dispatch, catalogue } = useStore()
  const today = useToday()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<HarvestStatus>('ready')

  const month = monthOf(today)
  const onPatch = new Set(state.harvest.map((item) => item.ingredientId))
  const found = growables(catalogue).filter((ingredient) => matchesQuery(ingredient.name, query))
  const seasonal = found.filter((ingredient) => inSeason(ingredient, month))
  const others = found.filter((ingredient) => !inSeason(ingredient, month))

  const setOnPatch = (id: IngredientId, on: boolean) =>
    dispatch(
      on
        ? { type: 'harvest/add', ingredientId: id, status, glut: false, today }
        : { type: 'harvest/remove', ingredientId: id },
    )

  return (
    <div className={styles.picker}>
      <div className={styles.pickerTop}>
        <SearchField
          label="Find a crop"
          hideLabel
          placeholder="Courgettes, kale, mint..."
          value={query}
          onChange={setQuery}
        />
        <div className={styles.addingAs}>
          <span aria-hidden="true" className={styles.addingAsLabel}>
            Adding as
          </span>
          <SegmentedControl label="Adding as" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </div>
      </div>

      {seasonal.length > 0 && (
        <ChipGroup
          title={`In season in ${monthName(today)}`}
          crops={seasonal}
          onPatch={onPatch}
          onChange={setOnPatch}
        />
      )}
      {others.length > 0 && (
        <ChipGroup title="Everything else" crops={others} onPatch={onPatch} onChange={setOnPatch} />
      )}
      {found.length === 0 && (
        <p className={styles.nothingFound} role="status">
          Nothing on the list matches that. You can add it yourself below.
        </p>
      )}

      <NewCrop status={status} />
    </div>
  )
}

interface ChipGroupProps {
  title: string
  crops: readonly Ingredient[]
  onPatch: ReadonlySet<IngredientId>
  onChange: (id: IngredientId, on: boolean) => void
}

function ChipGroup({ title, crops, onPatch, onChange }: ChipGroupProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.pickerGroup}>
      <h3 id={headingId} className={styles.pickerHeading}>
        {title}
      </h3>
      <ul role="list" className={styles.chips}>
        {crops.map((crop) => (
          <li key={crop.id}>
            <ToggleChip pressed={onPatch.has(crop.id)} onPressedChange={(on) => onChange(crop.id, on)}>
              {crop.name}
            </ToggleChip>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** "Not on the list?": the person's own crop, straight onto the patch. */
function NewCrop({ status }: { status: HarvestStatus }) {
  const { state, dispatch, catalogue } = useStore()
  const today = useToday()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')
  const headingId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setError('Give it a name first.')
      return
    }

    // Already on the list under that name: use it rather than making a twin.
    const existing = growables(catalogue).find(
      (ingredient) => ingredient.name.toLocaleLowerCase('en-GB') === trimmed.toLocaleLowerCase('en-GB'),
    )
    if (existing) {
      dispatch({ type: 'harvest/add', ingredientId: existing.id, status, glut: false, today })
      finish(existing.name)
      return
    }

    if (state.myIngredients.length >= LIMITS.myIngredients) {
      setError("You've added as many of your own as the app can hold.")
      return
    }
    const parsed = myIngredientSchema.safeParse({
      id: makeMyId(trimmed),
      name: trimmed,
      aisle: 'veg',
      growable: true,
      art: 'seedling',
      harvestMonths: [],
    } satisfies Ingredient)
    if (!parsed.success) {
      setError("That name won't work. Try a shorter one.")
      return
    }
    dispatch({ type: 'myIngredients/add', ingredient: parsed.data })
    dispatch({ type: 'harvest/add', ingredientId: parsed.data.id, status, glut: false, today })
    finish(trimmed)
  }

  function finish(addedName: string) {
    setName('')
    setError('')
    setAdded(addedName)
  }

  return (
    <section aria-labelledby={headingId} className={styles.newCrop}>
      <h3 id={headingId} className={styles.pickerHeading}>
        Not on the list?
      </h3>
      <form className={styles.newCropForm} onSubmit={submit} noValidate>
        <TextField
          label="Name"
          value={name}
          onChange={(next) => {
            setName(next)
            setError('')
            setAdded('')
          }}
          error={error || undefined}
          maxLength={LIMITS.nameLength}
          autoComplete="off"
          placeholder="e.g. Oca"
        />
        <Button type="submit" variant="secondary" icon="plus">
          Add to patch
        </Button>
      </form>
      {added && (
        <Notice tone="success">
          {added} is on the patch.
        </Notice>
      )}
    </section>
  )
}
