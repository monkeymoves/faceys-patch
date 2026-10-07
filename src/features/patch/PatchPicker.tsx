import { useId, useRef, useState, type FormEvent } from 'react'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { LIMITS, type HarvestStatus, type Ingredient, type IngredientId } from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'
import { SearchField } from '../../ui/SearchField'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Sheet } from '../../ui/Sheet'
import { TextField } from '../../ui/TextField'
import { ToggleChip } from '../../ui/ToggleChip'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { findOrMakeIngredient } from '../shared/ingredients'
import { matchesQuery, midSentence, plural } from '../shared/text'
import { useResultsAnnouncement } from '../shared/useResultsAnnouncement'
import { addedToPatch, growables, inSeason, monthName, monthOf, STATUS_OPTIONS, tookOffPatch } from './crops'
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
      tall
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

const NOTHING_FOUND = 'Nothing on the list matches that. You can add it yourself below.'

function PickerBody() {
  const { state, dispatch, catalogue } = useStore()
  const today = useToday()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<HarvestStatus>('ready')
  // Inside the sheet: anything behind an open modal isn't read out.
  const [announcement, announce] = useAnnouncer()

  const month = monthOf(today)
  const onPatch = new Set(state.harvest.map((item) => item.ingredientId))
  const found = growables(catalogue).filter((ingredient) => matchesQuery(ingredient.name, query))
  const seasonal = found.filter((ingredient) => inSeason(ingredient, month))
  const others = found.filter((ingredient) => !inSeason(ingredient, month))

  useResultsAnnouncement(
    announce,
    query,
    found.length === 0 ? NOTHING_FOUND : `${plural(found.length, 'crop', 'crops')} found.`,
  )

  const setOnPatch = (crop: Ingredient, on: boolean) => {
    dispatch(
      on
        ? { type: 'harvest/add', ingredientId: crop.id, status, today }
        : { type: 'harvest/remove', ingredientId: crop.id },
    )
    announce(on ? addedToPatch(crop.name) : tookOffPatch(crop.name))
  }

  return (
    <div className={styles.picker}>
      <Announcer message={announcement} />
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
      {found.length === 0 && <p className={styles.nothingFound}>{NOTHING_FOUND}</p>}

      <NewCrop status={status} announce={announce} />
    </div>
  )
}

interface ChipGroupProps {
  title: string
  crops: readonly Ingredient[]
  onPatch: ReadonlySet<IngredientId>
  onChange: (crop: Ingredient, on: boolean) => void
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
            <ToggleChip pressed={onPatch.has(crop.id)} onPressedChange={(on) => onChange(crop, on)}>
              {crop.name}
            </ToggleChip>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface NewCropProps {
  status: HarvestStatus
  announce: (text: string) => void
}

/**
 * "Not on the list?": anything typed goes on the patch. A name already known
 * (even one that isn't grown, like mushrooms) is used as it is; otherwise it
 * becomes a crop of the person's own.
 */
function NewCrop({ status, announce }: NewCropProps) {
  const { state, dispatch, catalogue } = useStore()
  const today = useToday()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const headingId = useId()

  function fail(message: string) {
    setError(message)
    setAdded('')
    // The message is tied to the field, so it's read out with it.
    nameField.current?.focus()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = findOrMakeIngredient(catalogue, { name, aisle: 'veg', grows: true }, state.myIngredients.length)
    if (!result.ok) {
      fail(result.error)
      return
    }
    const { ingredient, isNew } = result
    if (ingredient.assumed) {
      // Salt and water would make every recipe "from the patch".
      fail(`No need, ${midSentence(ingredient.name)} is always counted as in the larder.`)
      return
    }
    if (isNew) dispatch({ type: 'myIngredients/add', ingredient })
    dispatch({ type: 'harvest/add', ingredientId: ingredient.id, status, today })
    const message = addedToPatch(ingredient.name)
    setName('')
    setError('')
    setAdded(message)
    announce(message)
  }

  return (
    <section aria-labelledby={headingId} className={styles.newCrop}>
      <h3 id={headingId} className={styles.pickerHeading}>
        Not on the list?
      </h3>
      <form className={styles.newCropForm} onSubmit={submit} noValidate>
        <TextField
          ref={nameField}
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
          Add to the patch
        </Button>
      </form>
      {added && (
        <Notice tone="success" live={false}>
          {added}
        </Notice>
      )}
    </section>
  )
}
