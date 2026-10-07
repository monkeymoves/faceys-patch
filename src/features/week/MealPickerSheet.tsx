import { useId, useState } from 'react'
import { useMatches } from '../../app/hooks'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import {
  formatLongDate,
  PLANNABLE_COURSES,
  type Course,
  type ISODate,
  type Recipe,
  type RecipeId,
  type RecipeMatch,
} from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { SearchField } from '../../ui/SearchField'
import { Sheet } from '../../ui/Sheet'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { dinnerFirst, missingNames, patchDrawings } from '../recipes/recipeParts'
import { fold, plural } from '../shared/text'
import { useResultsAnnouncement } from '../shared/useResultsAnnouncement'
import { dayName } from './weekPlan'
import styles from './MealPicker.module.css'

const DINNERS: ReadonlySet<Course> = new Set<Course>(PLANNABLE_COURSES)

export interface MealPickerSheetProps {
  /** The day to add to. The sheet is closed while this is null. */
  date: ISODate | null
  onClose: () => void
  onPick: (recipeId: RecipeId) => void
}

/** "+" on a day: the best matches first, plus a search over every recipe. */
export function MealPickerSheet({ date, onClose, onPick }: MealPickerSheetProps) {
  return (
    <Sheet open={date !== null} onClose={onClose} title={date ? `What's for ${dayName(date)}?` : ''} tall>
      {date && <MealChoices date={date} onPick={onPick} />}
    </Sheet>
  )
}

interface Choice {
  recipe: Recipe
  match?: RecipeMatch
}

function MealChoices({ date, onPick }: { date: ISODate; onPick: (recipeId: RecipeId) => void }) {
  const { catalogue } = useStore()
  const matches = useMatches()
  const [query, setQuery] = useState('')
  const [announcement, announce] = useAnnouncer()
  const headingId = useId()
  const wanted = fold(query)

  let choices: Choice[]
  if (wanted === '') {
    choices = dinnerFirst(matches, DINNERS).map((match) => ({ recipe: match.recipe, match }))
  } else {
    const rank = new Map(matches.map((match, index) => [match.recipe.id, { match, index }]))
    choices = catalogue.recipes
      .filter((recipe) => fold(recipe.title).includes(wanted))
      .map((recipe) => ({ recipe, match: rank.get(recipe.id)?.match }))
      .toSorted((a, b) => {
        const ra = rank.get(a.recipe.id)?.index ?? Infinity
        const rb = rank.get(b.recipe.id)?.index ?? Infinity
        return ra - rb || a.recipe.title.localeCompare(b.recipe.title, 'en-GB')
      })
  }

  useResultsAnnouncement(
    announce,
    query,
    choices.length === 0 ? 'No recipes called that.' : `${plural(choices.length, 'recipe', 'recipes')} found.`,
  )

  return (
    <div className={styles.picker}>
      <Announcer message={announcement} />
      <p className={styles.lede}>Pick a dinner for {formatLongDate(date)}.</p>
      <SearchField
        label="Search all recipes"
        value={query}
        onChange={setQuery}
        placeholder="e.g. soup, chutney, pie"
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault()
        }}
      />
      <section aria-labelledby={headingId}>
        <h3 id={headingId} className={wanted === '' ? styles.heading : 'visually-hidden'}>
          {wanted === '' ? 'Best from the patch' : 'Recipes found'}
        </h3>
        {choices.length === 0 ? (
          <p className={styles.empty}>
            {wanted === ''
              ? 'Nothing on the patch matches a recipe yet. Search all the recipes instead.'
              : 'No recipes called that. Try another word.'}
          </p>
        ) : (
          <ul role="list" className={styles.list}>
            {choices.map((choice) => (
              <li key={choice.recipe.id}>
                <ChoiceButton choice={choice} onPick={onPick} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ChoiceButton({ choice, onPick }: { choice: Choice; onPick: (recipeId: RecipeId) => void }) {
  const { catalogue } = useStore()
  const titleId = useId()
  const detailsId = useId()
  const { recipe, match } = choice
  const veg = match ? patchDrawings(match.fromPatch, catalogue).slice(0, 3) : []
  const status = !match
    ? 'Nothing from the patch'
    : match.readiness === 'ready'
      ? 'Ready to cook'
      : `You'll need: ${missingNames(match.missing, catalogue).join(', ')}`

  return (
    <button
      type="button"
      className={styles.choice}
      aria-labelledby={titleId}
      aria-describedby={detailsId}
      onClick={() => onPick(recipe.id)}
    >
      <span className={styles.veg} aria-hidden="true">
        {veg.map((drawing) => (
          <Art key={drawing.art + drawing.name} name={drawing.art} size={30} className={styles.vegArt} />
        ))}
      </span>
      <span className={styles.text}>
        <span id={titleId} className={styles.title}>
          {recipe.title}
        </span>
        <span className={styles.details} aria-hidden="true">
          {recipe.minutes} min · {status}
        </span>
        <span id={detailsId} className="visually-hidden">
          {`${recipe.minutes} min. ${status}`}
        </span>
      </span>
    </button>
  )
}
