import { useEffect, useId, useRef, useState } from 'react'
import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { Art } from '../../art/Art'
import type { IngredientId } from '../../domain'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Page } from '../../ui/Page'
import { ProduceTile } from '../../ui/ProduceTile'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { CropSheet } from './CropSheet'
import { artFor, monthName, monthOf, patchCrops, seasonalPicks, type Crop } from './crops'
import { PatchPicker } from './PatchPicker'
import styles from './Patch.module.css'

const SUGGESTIONS = 6

/** "What's ready?": the crops on the plot, ready now and coming soon. */
export function PatchScreen() {
  const { state, catalogue } = useStore()
  const { go } = useNavigation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cropId, setCropId] = useState<IngredientId | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
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

  return (
    <Page>
      <ScreenTitle
        action={
          <Button ref={addButton} icon="plus" size="sm" onClick={() => setPickerOpen(true)}>
            Add
          </Button>
        }
      >
        What's ready?
      </ScreenTitle>

      {crops.length === 0 ? (
        <EmptyPatch
          onAddMore={() => setPickerOpen(true)}
          onQuickAdd={(id) => {
            focusAfterRender.current = () => tiles.current.get(id)?.focus()
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
        onRemoved={() => {
          setCropId(null)
          // Let go of the button in the closing sheet first, or the browser
          // moves focus on its own after ours. The tile it came from has gone.
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          focusAfterRender.current = () => addButton.current?.focus()
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

/** Nothing on the patch yet: say so kindly, and offer what's in season as one-tap tiles. */
function EmptyPatch({ onAddMore, onQuickAdd }: { onAddMore: () => void; onQuickAdd: (id: IngredientId) => void }) {
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
        Tell us what's ready on the plot and we'll find you something to cook.
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
                    dispatch({ type: 'harvest/add', ingredientId: ingredient.id, status: 'ready', glut: false, today })
                    onQuickAdd(ingredient.id)
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
