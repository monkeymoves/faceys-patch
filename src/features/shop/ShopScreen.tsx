import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSupplies } from '../../app/hooks'
import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { useViewedWeek } from '../../app/useViewedWeek'
import { Art } from '../../art/Art'
import {
  addDays,
  AISLE_LABELS,
  AISLES,
  buildShoppingList,
  formatWeekRange,
  parseISODate,
  shoppingListText,
  weekDates,
  type ISODate,
  type ShoppingItem,
} from '../../domain'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { EmptyState } from '../../ui/EmptyState'
import { IconButton } from '../../ui/IconButton'
import { Notice, type NoticeTone } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { forRecipes, isCancelled, movedMessage } from './shoppingCopy'
import styles from './Shop.module.css'

interface Message {
  tone: NoticeTone
  text: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** 'This week', 'Next week', 'Last week', 'In 3 weeks' or '2 weeks ago'. */
function relativeWeek(weekStart: ISODate, thisWeek: ISODate): string {
  const weeks = Math.round((parseISODate(weekStart).getTime() - parseISODate(thisWeek).getTime()) / (7 * DAY_MS))
  if (weeks === 0) return 'This week'
  if (weeks === 1) return 'Next week'
  if (weeks === -1) return 'Last week'
  return weeks > 0 ? `In ${weeks} weeks` : `${-weeks} weeks ago`
}

/** The shopping list for the week on show: what the planned meals need that you haven't got. */
export function ShopScreen() {
  const { state, dispatch, catalogue } = useStore()
  const supplies = useSupplies()
  const { go } = useNavigation()
  const { weekStart, thisWeek, showWeekOf } = useViewedWeek()
  const [message, setMessage] = useState<Message | null>(null)
  const messageBox = useRef<HTMLDivElement>(null)
  const focusMessageNext = useRef(false)

  // Putting things away disables or removes the button that did it, so focus moves to what happened.
  useEffect(() => {
    if (!focusMessageNext.current) return
    focusMessageNext.current = false
    messageBox.current?.focus()
  })

  const items = useMemo(
    () => buildShoppingList({ ...supplies, plan: state.plan, shoppingTicks: state.shoppingTicks, weekStart }),
    [supplies, state.plan, state.shoppingTicks, weekStart],
  )
  const meals = weekDates(weekStart).flatMap((date) => state.plan[date] ?? [])
  const ticked = items.filter((item) => item.ticked)
  const isThisWeek = weekStart === thisWeek

  function changeWeek(date: ISODate) {
    setMessage(null)
    showWeekOf(date)
  }

  function moveTicked() {
    const names = ticked.map((item) => item.name)
    dispatch({ type: 'shop/moveTickedToLarder', weekStart })
    setMessage({ tone: 'success', text: movedMessage(names) })
    focusMessageNext.current = true
  }

  async function share() {
    setMessage(null)
    const title = `Shopping for ${formatWeekRange(weekStart)}`
    const text = shoppingListText(items, title)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text })
      } catch (error) {
        if (!isCancelled(error)) {
          setMessage({ tone: 'problem', text: "The list couldn't be shared. Try again in a moment." })
        }
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setMessage({ tone: 'success', text: 'Copied to your clipboard' })
    } catch {
      setMessage({ tone: 'problem', text: "The list couldn't be copied. This browser may not allow it." })
    }
  }

  return (
    <Page>
      <ScreenTitle
        aside={formatWeekRange(weekStart)}
        action={
          !isThisWeek && (
            <Button size="sm" variant="secondary" onClick={() => changeWeek(thisWeek)}>
              This week
            </Button>
          )
        }
      >
        Shopping
      </ScreenTitle>

      <div className={styles.weekBar}>
        <IconButton
          icon="chevronLeft"
          label="Previous week"
          variant="secondary"
          onClick={() => changeWeek(addDays(weekStart, -7))}
        />
        <p className={styles.weekName}>{relativeWeek(weekStart, thisWeek)}</p>
        <IconButton
          icon="chevronRight"
          label="Next week"
          variant="secondary"
          onClick={() => changeWeek(addDays(weekStart, 7))}
        />
      </div>

      {items.length > 0 ? (
        <>
          <ShoppingList
            items={items}
            describe={(item) => forRecipes(item.forRecipes, catalogue) || undefined}
            onToggle={(item) => dispatch({ type: 'shop/toggle', weekStart, ingredientId: item.ingredientId })}
          />
          <div className={styles.actions}>
            <Button icon="jar" disabled={ticked.length === 0} onClick={moveTicked}>
              Put ticked in the larder
            </Button>
            <Button variant="secondary" icon="share" onClick={share}>
              Share list
            </Button>
          </div>
        </>
      ) : (
        <NothingToBuy
          planned={meals.length > 0}
          allCooked={meals.length > 0 && meals.every((meal) => meal.cooked)}
          isThisWeek={isThisWeek}
          onPlan={() => go({ tab: 'week' })}
        />
      )}

      {message && (
        <div ref={messageBox} tabIndex={-1} className={styles.message}>
          <Notice tone={message.tone} onDismiss={() => setMessage(null)}>
            {message.text}
          </Notice>
        </div>
      )}
    </Page>
  )
}

interface NothingToBuyProps {
  planned: boolean
  allCooked: boolean
  isThisWeek: boolean
  onPlan: () => void
}

function NothingToBuy({ planned, allCooked, isThisWeek, onPlan }: NothingToBuyProps) {
  if (!planned) {
    return (
      <EmptyState
        art={<Art name="carrot" size={96} />}
        title={isThisWeek ? 'Nothing planned this week' : 'Nothing planned that week'}
        action={<Button onClick={onPlan}>Plan the week</Button>}
      >
        Plan a few meals and anything you need to buy will show up here.
      </EmptyState>
    )
  }
  if (allCooked) {
    return (
      <EmptyState art={<Art name="tomato" size={96} />} title="Nothing left to buy">
        Everything planned that week has been cooked.
      </EmptyState>
    )
  }
  return (
    <EmptyState art={<Art name="tomato" size={96} />} title="Nothing to buy">
      It's all on the patch or in the larder.
    </EmptyState>
  )
}

interface ShoppingListProps {
  items: readonly ShoppingItem[]
  describe: (item: ShoppingItem) => string | undefined
  onToggle: (item: ShoppingItem) => void
}

function ShoppingList({ items, describe, onToggle }: ShoppingListProps) {
  const groups = AISLES.map((aisle) => ({ aisle, items: items.filter((item) => item.aisle === aisle) })).filter(
    (group) => group.items.length > 0,
  )
  return (
    <div className={styles.list}>
      {groups.map(({ aisle, items: inAisle }) => (
        <AisleGroup key={aisle} title={AISLE_LABELS[aisle]}>
          {inAisle.map((item) => (
            <li key={item.ingredientId} className={styles.item}>
              <Checkbox
                label={item.name}
                hint={describe(item)}
                strike
                checked={item.ticked}
                onCheckedChange={() => onToggle(item)}
              />
            </li>
          ))}
        </AisleGroup>
      ))}
    </div>
  )
}

function AisleGroup({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.aisle}>
      <h2 id={headingId} className={styles.aisleHeading}>
        {title}
      </h2>
      <ul role="list" className={styles.items}>
        {children}
      </ul>
    </section>
  )
}
