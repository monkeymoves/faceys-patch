import { useEffect, useId, useRef, useState } from 'react'
import { useSupplies } from '../../app/hooks'
import { useNavigation } from '../../app/useNavigation'
import { makeMealId } from '../../app/ids'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { useViewedWeek } from '../../app/useViewedWeek'
import {
  addDays,
  findRecipe,
  formatLongDate,
  formatMonthLabel,
  knownMeals,
  parseISODate,
  planWeek,
  weekDates,
  type ISODate,
  type PlannedMeal,
} from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { DayCard } from '../../ui/DayCard'
import { Notice } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { PeriodNav } from '../../ui/PeriodNav'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { RecipeFlow, type RecipeFlowState } from '../recipes/RecipeFlow'
import { weekLabel } from '../shared/weeks'
import { MealPickerSheet } from './MealPickerSheet'
import { MonthView } from './MonthView'
import {
  dayName,
  fillOutcome,
  fillState,
  monthOfWeek,
  shiftMonth,
  type FillOutcome,
  type MonthRef,
} from './weekPlan'
import styles from './WeekScreen.module.css'

type View = 'week' | 'month'

const VIEWS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const

/** The plan: a week of days (or a month), with "Fill my week" for the empty ones. */
export function WeekScreen() {
  const { state, dispatch, catalogue } = useStore()
  const supplies = useSupplies()
  const today = useToday()
  const { weekStart, thisWeek, showWeekOf } = useViewedWeek()
  const { go } = useNavigation()
  const [view, setView] = useState<View>('week')
  const [month, setMonth] = useState<MonthRef>(() => monthOfWeek(weekStart, today))
  const [flow, setFlow] = useState<RecipeFlowState | null>(null)
  const [addingTo, setAddingTo] = useState<ISODate | null>(null)
  const [outcome, setOutcome] = useState<(FillOutcome & { weekStart: ISODate }) | null>(null)
  const [announcement, announce] = useAnnouncer()
  const focusDay = useRef<ISODate | null>(null)
  const daysRef = useRef<HTMLUListElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fillHintId = useId()

  // After jumping from the month to a week, land on the day that was tapped.
  useEffect(() => {
    const date = focusDay.current
    if (!date || view !== 'week') return
    focusDay.current = null
    daysRef.current?.querySelector<HTMLElement>(`[aria-label="Add a meal to ${formatLongDate(date)}"]`)?.focus()
  }, [view, weekStart])

  const todaysMonth = monthOfWeek(thisWeek, today)
  const onThisMonth = month.year === todaysMonth.year && month.month === todaysMonth.month
  const fill = fillState(weekStart, today, state.plan, catalogue)
  const monthLabel = (shown: MonthRef) => formatMonthLabel(shown.year, shown.month)

  function changeView(next: View) {
    if (next === 'month') setMonth(monthOfWeek(weekStart, today))
    setView(next)
  }

  function showWeek(date: ISODate) {
    showWeekOf(date)
    announce(weekLabel(date, thisWeek))
  }

  function showMonth(next: MonthRef) {
    setMonth(next)
    announce(monthLabel(next))
  }

  function step(by: 1 | -1) {
    if (view === 'week') showWeek(addDays(weekStart, by * 7))
    else showMonth(shiftMonth(month, by))
  }

  function backToNow() {
    if (view === 'week') showWeek(thisWeek)
    else showMonth(todaysMonth)
  }

  function fillWeek() {
    if (!fill.canFill) return
    const chosen = planWeek({ ...supplies, plan: state.plan, dates: fill.dates })
    const meals = Object.fromEntries(
      Object.entries(chosen).map(([date, recipeId]): [ISODate, PlannedMeal] => [
        date,
        { id: makeMealId(), recipeId, cooked: false },
      ]),
    )
    const planned = Object.keys(meals).length
    if (planned > 0) dispatch({ type: 'plan/fill', meals })
    const result = fillOutcome(planned, fill.dates.length, state.harvest.length === 0)
    setOutcome({ ...result, weekStart })
    announce(result.text)
  }

  function dismissOutcome() {
    setOutcome(null)
    // The notice had focus if its close button was used: carry on from the top.
    headingRef.current?.focus()
  }

  function openMeal(date: ISODate, mealId: string) {
    const meal = (state.plan[date] ?? []).find((planned) => planned.id === mealId)
    if (meal) setFlow({ recipeId: meal.recipeId, meal: { date, mealId } })
  }

  const elsewhere = view === 'week' ? weekStart !== thisWeek : !onThisMonth

  return (
    <Page>
      <ScreenTitle
        ref={headingRef}
        action={<SegmentedControl label="View" options={VIEWS} value={view} onChange={changeView} />}
      >
        What's for dinner
      </ScreenTitle>
      <Announcer message={announcement} />

      <PeriodNav
        className={styles.bar}
        label={view === 'week' ? weekLabel(weekStart, thisWeek) : monthLabel(month)}
        previousLabel={view === 'week' ? 'Previous week' : 'Previous month'}
        nextLabel={view === 'week' ? 'Next week' : 'Next month'}
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
        jump={
          elsewhere
            ? { label: view === 'week' ? 'Back to this week' : 'Back to this month', onClick: backToNow }
            : undefined
        }
      />

      {view === 'week' ? (
        <>
          <ul ref={daysRef} role="list" className={styles.days}>
            {weekDates(weekStart).map((date) => (
              <li key={date}>
                <DayCard
                  dayName={dayName(date)}
                  dayNumber={parseISODate(date).getDate()}
                  label={formatLongDate(date)}
                  today={date === today}
                  past={date < today}
                  meals={knownMeals(state.plan, date, catalogue).map((meal) => ({
                    id: meal.id,
                    title: findRecipe(catalogue, meal.recipeId)?.title ?? '',
                    cooked: meal.cooked,
                  }))}
                  onSelectMeal={(mealId) => openMeal(date, mealId)}
                  onAddMeal={() => setAddingTo(date)}
                />
              </li>
            ))}
          </ul>

          <div className={styles.fill}>
            {outcome && outcome.weekStart === weekStart && (
              <div className={styles.outcome}>
                <Notice
                  tone={outcome.tone}
                  live={false}
                  onDismiss={dismissOutcome}
                  dismissLabel="Dismiss message"
                  action={
                    outcome.toPatch && (
                      <Button size="sm" variant="secondary" onClick={() => go({ tab: 'patch' })}>
                        Go to the patch
                      </Button>
                    )
                  }
                >
                  {outcome.text}
                </Notice>
              </div>
            )}
            {/* aria-disabled, so focus stays here when filling leaves nothing more to fill. */}
            <Button
              size="lg"
              fullWidth
              aria-disabled={fill.canFill ? undefined : true}
              aria-describedby={fillHintId}
              onClick={fillWeek}
            >
              Fill my week
            </Button>
            <p id={fillHintId} className={styles.fillHint}>
              {fill.canFill ? fill.hint : fill.reason}
            </p>
          </div>
        </>
      ) : (
        <div className={styles.monthWrap}>
          <MonthView
            month={month}
            today={today}
            onPickDay={(date) => {
              focusDay.current = date
              showWeek(date)
              setView('week')
            }}
          />
        </div>
      )}

      <MealPickerSheet
        date={addingTo}
        onClose={() => setAddingTo(null)}
        onPick={(recipeId) => {
          if (addingTo) {
            dispatch({ type: 'plan/add', date: addingTo, meal: { id: makeMealId(), recipeId, cooked: false } })
          }
          setAddingTo(null)
        }}
      />
      <RecipeFlow flow={flow} onFlowChange={setFlow} />
    </Page>
  )
}
