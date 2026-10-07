import { useId, type ReactNode } from 'react'
import { useSupplies } from '../../app/hooks'
import { Art } from '../../art/Art'
import { formatLongDate, type ISODate, type Recipe } from '../../domain'
import { Button } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Icon, type IconName } from '../../ui/icons'
import { Notice } from '../../ui/Notice'
import { Sheet } from '../../ui/Sheet'
import { dietLabel, groupIngredients, type IngredientLine } from './recipeParts'
import styles from './RecipeView.module.css'

export interface PlannedMealView {
  date: ISODate
  cooked: boolean
}

export interface RecipeViewSheetProps {
  /** The recipe to show. The sheet is closed while this is undefined. */
  recipe: Recipe | undefined
  /** True for the person's own recipe: Edit and Delete instead of "Make my own version". */
  mine: boolean
  /** Set when opened from a day on the Week: adds that meal's own actions. */
  meal?: PlannedMealView
  /** A short confirmation, e.g. after adding it to a day. */
  notice?: string
  onClose: () => void
  onAddToWeek: () => void
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
  onSetCooked: (cooked: boolean) => void
  onTakeOff: () => void
}

/** One recipe: what it needs from the patch, the larder and the shop, then the method. */
export function RecipeViewSheet({
  recipe,
  mine,
  meal,
  notice,
  onClose,
  onAddToWeek,
  onEdit,
  onCopy,
  onDelete,
  onSetCooked,
  onTakeOff,
}: RecipeViewSheetProps) {
  const footer = meal ? (
    <>
      {meal.cooked ? (
        <Button variant="secondary" onClick={() => onSetCooked(false)}>
          Not cooked yet
        </Button>
      ) : (
        <Button icon="tick" onClick={() => onSetCooked(true)}>
          Mark as cooked
        </Button>
      )}
      <Button variant="secondary" onClick={onTakeOff}>
        Take off this day
      </Button>
    </>
  ) : (
    <Button icon="calendar" onClick={onAddToWeek}>
      Add to week
    </Button>
  )

  return (
    <Sheet open={recipe !== undefined} onClose={onClose} title={recipe?.title ?? ''} footer={footer}>
      {recipe && (
        <RecipeDetails recipe={recipe} meal={meal} notice={notice}>
          {meal && (
            <Button variant="ghost" size="sm" icon="calendar" onClick={onAddToWeek}>
              Add to another day
            </Button>
          )}
          {mine ? (
            <>
              <Button variant="ghost" size="sm" icon="pencil" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" icon="bin" onClick={onDelete} className={styles.delete}>
                Delete
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" icon="pencil" onClick={onCopy}>
              Make my own version
            </Button>
          )}
        </RecipeDetails>
      )}
    </Sheet>
  )
}

interface RecipeDetailsProps {
  recipe: Recipe
  meal?: PlannedMealView
  notice?: string
  /** The quieter actions, under the method. */
  children: ReactNode
}

function RecipeDetails({ recipe, meal, notice, children }: RecipeDetailsProps) {
  const supplies = useSupplies()
  const groups = groupIngredients(recipe, supplies)
  const diet = dietLabel(recipe)
  const methodId = useId()

  return (
    <div className={styles.recipe}>
      {recipe.blurb && <p className={styles.blurb}>{recipe.blurb}</p>}
      <p className={styles.meta}>
        <span className={styles.metaItem}>
          <Icon name="clock" size={18} />
          {recipe.minutes} min
        </span>
        <span className={styles.metaItem}>Serves {recipe.serves}</span>
        {diet && <span className={styles.diet}>{diet}</span>}
      </p>
      {meal && (
        <p className={styles.planned}>
          <Icon name="calendar" size={18} />
          <span>
            On the plan for {formatLongDate(meal.date)}
            {meal.cooked && ', cooked'}
          </span>
        </p>
      )}
      {/* Always there, so the confirmation is announced when it appears. */}
      <div aria-live="polite" className={styles.live}>
        {notice && (
          <Notice tone="success" className={styles.notice}>
            {notice}
          </Notice>
        )}
      </div>

      <IngredientGroup title="From the patch" icon="trowel" tone="patch" lines={groups.patch} />
      <IngredientGroup title="In the larder" icon="jar" tone="larder" lines={groups.larder} />
      <IngredientGroup title="To buy" icon="basket" tone="buy" lines={groups.buy} />

      {recipe.steps.length > 0 && (
        <section aria-labelledby={methodId} className={styles.group}>
          <h3 id={methodId} className={styles.groupHeading}>
            Method
          </h3>
          <ol className={styles.steps}>
            {recipe.steps.map((step, index) => (
              <li key={index} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className={styles.more}>{children}</div>
    </div>
  )
}

interface IngredientGroupProps {
  title: string
  icon: IconName
  tone: 'patch' | 'larder' | 'buy'
  lines: readonly IngredientLine[]
}

function IngredientGroup({ title, icon, tone, lines }: IngredientGroupProps) {
  const headingId = useId()
  if (lines.length === 0) return null
  return (
    <section aria-labelledby={headingId} className={styles.group}>
      <h3 id={headingId} className={styles.groupHeading}>
        <Icon name={icon} size={22} className={cx(styles.groupIcon, styles[tone])} />
        {title}
      </h3>
      <ul role="list" className={styles.lines}>
        {lines.map((line) => (
          <li key={line.ingredient.id} className={styles.line}>
            <span className={styles.lineArt} aria-hidden="true">
              {line.ingredient.art && <Art name={line.ingredient.art} size={34} />}
            </span>
            <span className={styles.lineText}>
              <span className={styles.lineName}>
                {line.ingredient.name}
                {line.optional && <span className={styles.optional}> optional</span>}
              </span>
              {line.amount && <span className={styles.amount}>{line.amount}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
