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
  knownMeals,
  shoppingListText,
  weekDates,
  type ISODate,
  type ShoppingItem,
} from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { EmptyState } from '../../ui/EmptyState'
import { Notice, type NoticeTone } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { PeriodNav } from '../../ui/PeriodNav'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { weekLabel } from '../shared/weeks'
import { forRecipes, isCancelled, movedMessage } from './shoppingCopy'
import styles from './Shop.module.css'

interface Message {
  tone: NoticeTone
  text: string
}

/** The shopping list for the week on show: what the planned meals need that you haven't got. */
export function ShopScreen() {
  const { state, dispatch, catalogue } = useStore()
  const supplies = useSupplies()
  const { go } = useNavigation()
  const { weekStart, thisWeek, showWeekOf } = useViewedWeek()
  const [message, setMessage] = useState<Message | null>(null)
  const [announcement, announce] = useAnnouncer()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moveButton = useRef<HTMLButtonElement>(null)
  const focusHeadingNext = useRef(false)
  const moveHintId = useId()

  // Putting the last things away takes the list (and the button) with it, so carry on from the top.
  useEffect(() => {
    if (!focusHeadingNext.current) return
    focusHeadingNext.current = false
    if (!moveButton.current?.isConnected) headingRef.current?.focus()
  })

  const items = useMemo(
    () => buildShoppingList({ ...supplies, plan: state.plan, shoppingTicks: state.shoppingTicks, weekStart }),
    [supplies, state.plan, state.shoppingTicks, weekStart],
  )
  const meals = weekDates(weekStart).flatMap((date) => knownMeals(state.plan, date, catalogue))
  const ticked = items.filter((item) => item.ticked)
  const isThisWeek = weekStart === thisWeek

  function say(next: Message) {
    setMessage(next)
    announce(next.text)
  }

  function changeWeek(date: ISODate) {
    setMessage(null)
    showWeekOf(date)
    announce(weekLabel(date, thisWeek))
  }

  function moveTicked() {
    if (ticked.length === 0) return
    dispatch({ type: 'shop/moveTickedToLarder', weekStart, ingredientIds: ticked.map((item) => item.ingredientId) })
    say({ tone: 'success', text: movedMessage(ticked.map((item) => item.name)) })
    focusHeadingNext.current = true
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
          say({ tone: 'problem', text: "The list couldn't be shared. Try again in a moment." })
        }
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      say({ tone: 'success', text: 'Copied to your clipboard.' })
    } catch {
      say({ tone: 'problem', text: "The list couldn't be copied. This browser may not allow it." })
    }
  }

  return (
    <Page>
      <ScreenTitle ref={headingRef}>Shopping list</ScreenTitle>
      <Announcer message={announcement} />

      <PeriodNav
        className={styles.weekBar}
        label={weekLabel(weekStart, thisWeek)}
        previousLabel="Previous week"
        nextLabel="Next week"
        onPrevious={() => changeWeek(addDays(weekStart, -7))}
        onNext={() => changeWeek(addDays(weekStart, 7))}
        jump={isThisWeek ? undefined : { label: 'Back to this week', onClick: () => changeWeek(thisWeek) }}
      />

      {items.length > 0 ? (
        <>
          <ShoppingList
            items={items}
            describe={(item) => forRecipes(item.forRecipes, catalogue) || undefined}
            onToggle={(item) => dispatch({ type: 'shop/toggle', weekStart, ingredientId: item.ingredientId })}
          />
          <div className={styles.actions}>
            <div className={styles.move}>
              {/* aria-disabled rather than disabled, so it keeps focus and can say why. */}
              <Button
                ref={moveButton}
                icon="jar"
                aria-disabled={ticked.length === 0 ? true : undefined}
                aria-describedby={ticked.length === 0 ? moveHintId : undefined}
                onClick={moveTicked}
              >
                Put ticked in the larder
              </Button>
              {ticked.length === 0 && (
                <p id={moveHintId} className={styles.moveHint}>
                  Tick what you've bought first.
                </p>
              )}
            </div>
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
        <div className={styles.message}>
          <Notice
            tone={message.tone}
            live={false}
            onDismiss={() => {
              setMessage(null)
              headingRef.current?.focus()
            }}
          >
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
