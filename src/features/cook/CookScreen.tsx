import { Fragment, useId, useRef, useState, type ReactElement } from 'react'
import { useMatches } from '../../app/hooks'
import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import type { RecipeId } from '../../domain'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { HandNote } from '../../ui/HandNote'
import { IconButton } from '../../ui/IconButton'
import { Page } from '../../ui/Page'
import { RecipeCard } from '../../ui/RecipeCard'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { RecipeFlow, type RecipeFlowState } from '../recipes/RecipeFlow'
import { lowerName, missingNames, patchDrawings } from '../recipes/recipeParts'
import { COOK_FILTERS, cookEntries, emptyFilterCopy, splitByCourse, type CookEntry, type CookFilter } from './cookList'
import styles from './CookScreen.module.css'

/** Recipes that use what's on the patch, best first. */
export function CookScreen() {
  const { state, catalogue } = useStore()
  const matches = useMatches()
  const { route, go } = useNavigation()
  const [filter, setFilter] = useState<CookFilter>('all')
  const [flow, setFlow] = useState<RecipeFlowState | null>(null)

  const withId = route.with
  const withIngredient = withId ? catalogue.ingredients.get(withId) : undefined
  const withName = withId ? (withIngredient ? lowerName(withIngredient) : withId) : undefined
  const entries = cookEntries(matches, state.myRecipes, filter, withId)
  const { meals, treats } = splitByCourse(entries)
  const gluts = new Set(state.harvest.filter((item) => item.glut).map((item) => item.ingredientId))
  // One "uses your glut" note, on the best meal that does. Bakes and preserves have their own aside.
  const glutPick = meals.find((entry) => entry.match?.fromPatch.some((id) => gluts.has(id)))?.recipe.id

  const writeRecipe = () => setFlow({ top: 'new' })
  const openRecipe = (recipeId: RecipeId) => setFlow({ recipeId })
  const showAll = () => go({ tab: 'cook' })

  function renderEmpty() {
    if (filter !== 'mine' && state.harvest.length === 0) {
      return (
        <EmptyState
          art={<Art name="seedling" size={96} />}
          title="Nothing on the patch yet"
          action={<Button onClick={() => go({ tab: 'patch' })}>Go to the patch</Button>}
        >
          Add what's ready on the plot and recipes that use it will turn up here.
        </EmptyState>
      )
    }
    if (filter === 'all' && !withId && matches.length === 0) {
      return (
        <EmptyState
          art={<Art name="seedling" size={96} />}
          title="No recipes use that yet"
          action={
            <Button icon="pencil" onClick={writeRecipe}>
              Write a recipe
            </Button>
          }
        >
          None of the recipes use what's on your patch. Got a favourite? Write it down.
        </EmptyState>
      )
    }
    const copy = emptyFilterCopy(filter, withName)
    const action =
      filter === 'mine' ? (
        <Button icon="pencil" onClick={writeRecipe}>
          Write a recipe
        </Button>
      ) : withId ? (
        <Button variant="secondary" onClick={showAll}>
          Show all recipes
        </Button>
      ) : undefined
    return (
      <EmptyState title={copy.title} action={action}>
        {copy.text}
      </EmptyState>
    )
  }

  const card = (entry: CookEntry) => {
    const { recipe, match } = entry
    return (
      <li key={recipe.id}>
        <RecipeCard
          title={recipe.title}
          minutes={recipe.minutes}
          serves={recipe.serves}
          uses={match ? patchDrawings(match.fromPatch, catalogue) : []}
          readiness={match?.readiness ?? 'shop'}
          missing={match ? missingNames(match.missing, catalogue) : []}
          note={recipe.id === glutPick ? 'uses your glut' : undefined}
          statusNote={match ? undefined : 'Nothing from the patch yet'}
          onClick={() => openRecipe(recipe.id)}
        />
      </li>
    )
  }

  return (
    <Page>
      <ScreenTitle
        aside={entries.length > 0 ? 'best first' : undefined}
        action={
          <Button variant="secondary" size="sm" icon="pencil" onClick={writeRecipe}>
            Write a recipe
          </Button>
        }
      >
        What to cook
      </ScreenTitle>

      <div className={styles.filters}>
        <SegmentedControl label="Show" options={COOK_FILTERS} value={filter} onChange={setFilter} />
        {withId && (
          <p className={styles.with}>
            {withIngredient?.art && <Art name={withIngredient.art} size={30} className={styles.withArt} />}
            <span className={styles.withText}>With {withName}</span>
            <IconButton icon="close" label={`Show all, not just ${withName}`} onClick={showAll} />
          </p>
        )}
      </div>

      {entries.length === 0 ? (
        renderEmpty()
      ) : (
        <Fragment key={`${filter}-${withId ?? ''}`}>
          <RecipeSection title="Meals" what="meals" entries={meals} card={card} />
          <RecipeSection
            title="Bakes, puddings and preserves"
            what="bakes, puddings and preserves"
            aside="got a glut?"
            entries={treats}
            card={card}
          />
        </Fragment>
      )}

      <RecipeFlow flow={flow} onFlowChange={setFlow} />
    </Page>
  )
}

/** How many cards a section shows before "Show more". The best are at the top. */
const FIRST_FEW = 8

interface RecipeSectionProps {
  title: string
  /** For the "Show 12 more meals" button. */
  what: string
  aside?: string
  entries: readonly CookEntry[]
  card: (entry: CookEntry) => ReactElement
}

function RecipeSection({ title, what, aside, entries, card }: RecipeSectionProps) {
  const headingId = useId()
  const [showAll, setShowAll] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  if (entries.length === 0) return null
  const hidden = showAll ? 0 : Math.max(0, entries.length - FIRST_FEW)
  const shown = hidden > 0 ? entries.slice(0, FIRST_FEW) : entries
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 id={headingId} className={styles.sectionTitle}>
          {title}
        </h2>
        {aside && <HandNote tilt="left">{aside}</HandNote>}
      </div>
      <ul ref={listRef} role="list" className={styles.list}>
        {shown.map(card)}
      </ul>
      {hidden > 0 && (
        <Button
          variant="secondary"
          fullWidth
          className={styles.more}
          onClick={() => {
            setShowAll(true)
            // Keep keyboard focus in the list: the first newly shown card.
            requestAnimationFrame(() => listRef.current?.querySelectorAll('button')[FIRST_FEW]?.focus())
          }}
        >
          Show {hidden} more {what}
        </Button>
      )}
    </section>
  )
}
