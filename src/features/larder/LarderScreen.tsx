import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import { STARTER_LARDER } from '../../data'
import { AISLE_LABELS, type Ingredient, type IngredientId } from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Icon } from '../../ui/icons'
import { Page } from '../../ui/Page'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { SearchField } from '../../ui/SearchField'
import { ToggleChip } from '../../ui/ToggleChip'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { matchesQuery, plural } from '../shared/text'
import { useResultsAnnouncement } from '../shared/useResultsAnnouncement'
import { NewLarderItem } from './NewLarderItem'
import { addedToLarder, byAisle, stockable, tookOutOfLarder } from './stock'
import styles from './Larder.module.css'

/** Search results beyond this ask for a few more letters, so the list stays short. */
const MAX_RESULTS = 30

const NOTHING_FOUND = 'Nothing on the list matches that. You can add it yourself below.'

/** What's in the cupboard and fridge. Tap to take out or put in. */
export function LarderScreen() {
  const { state, dispatch, catalogue } = useStore()
  const [query, setQuery] = useState('')
  // Tapped on this visit: things stay where they were tapped, so a slip is one
  // tap to undo and focus never vanishes from under the person.
  const [takenOut, setTakenOut] = useState<ReadonlySet<IngredientId>>(new Set())
  const [putIn, setPutIn] = useState<ReadonlySet<IngredientId>>(new Set())
  const [announcement, announce] = useAnnouncer()
  const shelfHeading = useRef<HTMLHeadingElement>(null)
  const focusShelfNext = useRef(false)
  const shelfId = useId()
  const addId = useId()

  // "Add the usual suspects" replaces the empty state, button and all, so carry on from the new list.
  useEffect(() => {
    if (!focusShelfNext.current) return
    focusShelfNext.current = false
    shelfHeading.current?.focus()
  })

  const everything = useMemo(() => stockable(catalogue), [catalogue])
  const inLarder = new Set(state.larder)
  const onShelf = everything.filter((ingredient) => inLarder.has(ingredient.id) || takenOut.has(ingredient.id))
  const toBrowse = everything.filter(
    (ingredient) => (!inLarder.has(ingredient.id) && !takenOut.has(ingredient.id)) || putIn.has(ingredient.id),
  )
  const searching = query.trim() !== ''
  const results = searching ? everything.filter((ingredient) => matchesQuery(ingredient.name, query)) : []

  useResultsAnnouncement(
    announce,
    query,
    results.length === 0 ? NOTHING_FOUND : `${plural(results.length, 'thing', 'things')} found.`,
  )

  function setStocked({ id, name }: Ingredient, on: boolean) {
    if (on) {
      dispatch({ type: 'larder/add', ingredientIds: [id] })
      setPutIn((current) => new Set(current).add(id))
      announce(addedToLarder(name))
      return
    }
    dispatch({ type: 'larder/remove', ingredientId: id })
    setTakenOut((current) => new Set(current).add(id))
    announce(tookOutOfLarder(name))
  }

  const chip = (ingredient: Ingredient) => (
    <li key={ingredient.id}>
      <ToggleChip pressed={inLarder.has(ingredient.id)} onPressedChange={(on) => setStocked(ingredient, on)}>
        {ingredient.name}
      </ToggleChip>
    </li>
  )

  return (
    <Page>
      <ScreenTitle>Larder</ScreenTitle>
      <Announcer message={announcement} />

      {onShelf.length === 0 ? (
        <EmptyState
          art={<Art name="garlic" size={96} />}
          title="Nothing in the larder yet"
          action={
            <Button
              icon="plus"
              onClick={() => {
                dispatch({ type: 'larder/add', ingredientIds: STARTER_LARDER })
                announce(`Added ${plural(STARTER_LARDER.length, 'thing', 'things')} to the larder.`)
                focusShelfNext.current = true
              }}
            >
              Add the usual suspects
            </Button>
          }
        >
          Start with the basics most kitchens have, or search below for anything at all.
        </EmptyState>
      ) : (
        <section aria-labelledby={shelfId} className={styles.section}>
          <h2 id={shelfId} ref={shelfHeading} tabIndex={-1} className={styles.heading}>
            In the larder
          </h2>
          <p className={styles.note}>Run out of something? Tap it to take it out.</p>
          {byAisle(onShelf).map(({ aisle, items }) => (
            <div key={aisle} className={styles.aisle}>
              <h3 className={styles.aisleHeading}>{AISLE_LABELS[aisle]}</h3>
              <ul role="list" className={styles.chips}>
                {items.map(chip)}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby={addId} className={styles.section}>
        <h2 id={addId} className={styles.heading}>
          Add to the larder
        </h2>
        <SearchField
          label="Search for anything"
          hideLabel
          placeholder="Feta, lemons, rice..."
          value={query}
          onChange={setQuery}
          className={styles.search}
        />

        {searching ? (
          <SearchResults results={results} renderChip={chip} />
        ) : (
          <Browse groups={byAisle(toBrowse)} renderChip={chip} />
        )}
      </section>

      <NewLarderItem announce={announce} />
    </Page>
  )
}

interface ListProps {
  renderChip: (ingredient: Ingredient) => ReactNode
}

function SearchResults({ results, renderChip }: ListProps & { results: readonly Ingredient[] }) {
  if (results.length === 0) return <p className={styles.note}>{NOTHING_FOUND}</p>
  const shown = results.slice(0, MAX_RESULTS)
  return (
    <>
      <ul role="list" aria-label="Search results" className={styles.chips}>
        {shown.map(renderChip)}
      </ul>
      {results.length > shown.length && (
        <p className={styles.note}>Plenty more. Keep typing to narrow it down.</p>
      )}
    </>
  )
}

function Browse({ groups, renderChip }: ListProps & { groups: ReturnType<typeof byAisle> }) {
  const headingId = useId()
  if (groups.length === 0) return null
  return (
    <div role="group" aria-labelledby={headingId} className={styles.browse}>
      <h3 id={headingId} className={styles.subheading}>
        Browse everything
      </h3>
      {groups.map(({ aisle, items }) => (
        <details key={aisle} className={styles.details}>
          <summary className={styles.summary}>
            <span>{AISLE_LABELS[aisle]}</span>
            <Icon name="chevronRight" size={20} className={styles.chevron} />
          </summary>
          <ul role="list" className={styles.chips}>
            {items.map(renderChip)}
          </ul>
        </details>
      ))}
    </div>
  )
}
