import { useEffect, useId, useRef, useState } from 'react'
import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { Art } from '../../art/Art'
import type { HarvestItem, Ingredient, IngredientId } from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Notice } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { ProduceTile } from '../../ui/ProduceTile'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { midSentence } from '../shared/text'
import { CropSheet } from './CropSheet'
import {
  addedToPatch,
  artFor,
  monthName,
  monthOf,
  patchCrops,
  seasonalPicks,
  tookOffPatch,
  type Crop,
} from './crops'
import { PatchPicker } from './PatchPicker'
import styles from './Patch.module.css'

/** A crop just taken off, kept so "Undo" can put it back exactly as it was. */
interface Removed {
  item: HarvestItem
  name: string
}

const SUGGESTIONS = 6

/** "What's ready?": the crops on the plot, ready now and coming soon. */
export function PatchScreen() {
  const { state, dispatch, catalogue } = useStore()
  const { go } = useNavigation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cropId, setCropId] = useState<IngredientId | null>(null)
  const [removed, setRemoved] = useState<Removed | null>(null)
  const [announcement, announce] = useAnnouncer()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const undoButton = useRef<HTMLButtonElement>(null)
  const tiles = useRef(new Map<IngredientId, HTMLButtonElement>())
  // When the thing that had focus goes away (a tile taken off, the empty state
  // after a quick-add), say where focus goes once the next render is on screen.
  const focusAfterRender = useRef<(() => void) | null>(null)

  useEffect(() => {
    const focus = focusAfterRender.current
    focusAfterRender.current = null
    focus?.()
  })

  const registerTile = (id: IngredientId, node: HTMLButtonElement) => {
    tiles.current.set(id, node)
    return () => {
      tiles.current.delete(id)
    }
  }

  const crops = patchCrops(state.harvest, catalogue)
  const ready = crops.filter((crop) => crop.status === 'ready')
  const soon = crops.filter((crop) => crop.status === 'soon')

  function undoRemove() {
    if (!removed) return
    const { item, name } = removed
    // Back exactly as it was: same status, glut and date.
    const { ingredientId, status, glut, addedOn } = item
    dispatch({ type: 'harvest/add', ingredientId, status, glut, today: addedOn })
    setRemoved(null)
    announce(`Put ${midSentence(name)} back on the patch.`)
    focusAfterRender.current = () => tiles.current.get(item.ingredientId)?.focus()
  }

  return (
    <Page>
      <ScreenTitle
        ref={headingRef}
        action={
          // On an empty patch, "Add what's ready" below does this.
          crops.length > 0 && (
            <Button icon="plus" size="sm" onClick={() => setPickerOpen(true)}>
              Add
            </Button>
          )
        }
      >
        What's ready?
      </ScreenTitle>
      <Announcer message={announcement} />

      {removed && (
        <Notice
          tone="success"
          live={false}
          className={styles.removed}
          action={
            <Button ref={undoButton} size="sm" variant="secondary" onClick={undoRemove}>
              Undo
            </Button>
          }
          onDismiss={() => {
            setRemoved(null)
            headingRef.current?.focus()
          }}
        >
          {tookOffPatch(removed.name)}
        </Notice>
      )}

      {crops.length === 0 ? (
        <EmptyPatch
          onAddMore={() => setPickerOpen(true)}
          onQuickAdd={(ingredient) => {
            announce(addedToPatch(ingredient.name))
            focusAfterRender.current = () => tiles.current.get(ingredient.id)?.focus()
          }}
        />
      ) : (
        <>
          <CropGroup title="Ready now" crops={ready} onOpen={setCropId} registerTile={registerTile} />
          <CropGroup title="Coming soon" crops={soon} onOpen={setCropId} registerTile={registerTile} />
          <div className={styles.cookLink}>
            <Button variant="ghost" icon="pot" onClick={() => go({ tab: 'cook' })}>
              See what you can cook
            </Button>
          </div>
        </>
      )}

      <CropSheet
        cropId={cropId}
        onClose={() => setCropId(null)}
        onRemoved={(item) => {
          setCropId(null)
          const name = catalogue.ingredients.get(item.ingredientId)?.name ?? item.ingredientId
          setRemoved({ item, name })
          announce(tookOffPatch(name))
          // Let go of the button in the closing sheet first, or the browser
          // moves focus on its own after ours. The tile it came from has gone,
          // so land on "Undo", the likeliest next move.
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          focusAfterRender.current = () => undoButton.current?.focus()
        }}
      />
      <PatchPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </Page>
  )
}

interface CropGroupProps {
  title: string
  crops: readonly Crop[]
  onOpen: (id: IngredientId) => void
  registerTile: (id: IngredientId, node: HTMLButtonElement) => () => void
}

function CropGroup({ title, crops, onOpen, registerTile }: CropGroupProps) {
  const headingId = useId()
  if (crops.length === 0) return null
  return (
    <section aria-labelledby={headingId} className={styles.group}>
      <h2 id={headingId} className={styles.groupHeading}>
        {title}
      </h2>
      <ul role="list" className={styles.tileGrid}>
        {crops.map((crop) => (
          <li key={crop.id}>
            <ProduceTile
              ref={(node) => (node ? registerTile(crop.id, node) : undefined)}
              name={crop.name}
              art={crop.art}
              status={crop.status}
              glut={crop.glut}
              showStatus={false}
              onClick={() => onOpen(crop.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

interface EmptyPatchProps {
  onAddMore: () => void
  onQuickAdd: (ingredient: Ingredient) => void
}

/** Nothing on the patch yet: say so kindly, and offer what's in season as one-tap tiles. */
function EmptyPatch({ onAddMore, onQuickAdd }: EmptyPatchProps) {
  const { dispatch, catalogue } = useStore()
  const today = useToday()
  const headingId = useId()
  const picks = seasonalPicks(catalogue, monthOf(today), SUGGESTIONS)

  return (
    <>
      <EmptyState
        art={<Art name="seedling" size={96} />}
        title="Nothing picked yet"
        action={
          <Button icon="plus" onClick={onAddMore}>
            Add what's ready
          </Button>
        }
      >
        Add what's ready on the plot and recipes that use it will turn up.
      </EmptyState>

      {picks.length > 0 && (
        <section aria-labelledby={headingId} className={styles.group}>
          <h2 id={headingId} className={styles.groupHeading}>
            In season in {monthName(today)}
          </h2>
          <p className={styles.groupNote}>Tap one to put it on the patch.</p>
          <ul role="list" className={styles.tileGrid}>
            {picks.map((ingredient) => (
              <li key={ingredient.id}>
                <ProduceTile
                  name={ingredient.name}
                  art={artFor(ingredient)}
                  status="ready"
                  showStatus={false}
                  aria-label={`Add ${ingredient.name}`}
                  onClick={() => {
                    dispatch({ type: 'harvest/add', ingredientId: ingredient.id, status: 'ready', today })
                    onQuickAdd(ingredient)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
