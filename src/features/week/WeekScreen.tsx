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
  formatWeekRange,
  parseISODate,
  planWeek,
  weekDates,
  type ISODate,
  type PlannedMeal,
} from '../../domain'
import { Button } from '../../ui/Button'
import { DayCard } from '../../ui/DayCard'
import { IconButton } from '../../ui/IconButton'
import { Notice } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { RecipeFlow, type RecipeFlowState } from '../recipes/RecipeFlow'
import { MealPickerSheet } from './MealPickerSheet'
import { MonthView } from './MonthView'
import {
  dayName,
  fillOutcome,
  fillState,
  knownMeals,
  monthOfWeek,
  shiftMonth,
  weekTitle,
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
  const focusDay = useRef<ISODate | null>(null)
  const previousRef = useRef<HTMLButtonElement>(null)
  const daysRef = useRef<HTMLUListElement>(null)
  const outcomeRef = useRef<HTMLDivElement>(null)
  const fillHintId = useId()

  // After jumping from the month to a week, land on the day that was tapped.
  useEffect(() => {
    const date = focusDay.current
    if (!date || view !== 'week') return
    focusDay.current = null
    daysRef.current?.querySelector<HTMLElement>(`[aria-label="Add a meal to ${formatLongDate(date)}"]`)?.focus()
  }, [view, weekStart])

  // After "Fill my week", read out what happened (the button may now be disabled).
  useEffect(() => {
    if (outcome) outcomeRef.current?.focus()
  }, [outcome])

  const todaysMonth = monthOfWeek(thisWeek, today)
  const onThisMonth = month.year === todaysMonth.year && month.month === todaysMonth.month
  const fill = fillState(weekStart, today, state.plan)
  const title = view === 'week' ? weekTitle(weekStart, thisWeek) : formatMonthLabel(month.year, month.month)
  const range = formatWeekRange(weekStart)

  function changeView(next: View) {
    if (next === 'month') setMonth(monthOfWeek(weekStart, today))
    setView(next)
  }

  function step(by: 1 | -1) {
    if (view === 'week') showWeekOf(addDays(weekStart, by * 7))
    else setMonth((current) => shiftMonth(current, by))
  }

  function backToNow() {
    if (view === 'week') showWeekOf(today)
    else setMonth(todaysMonth)
    previousRef.current?.focus()
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
    setOutcome({ ...fillOutcome(planned, fill.dates.length, state.harvest.length === 0), weekStart })
  }

  function openMeal(date: ISODate, mealId: string) {
    const meal = (state.plan[date] ?? []).find((planned) => planned.id === mealId)
    if (meal) setFlow({ recipeId: meal.recipeId, meal: { date, mealId } })
  }

  const elsewhere = view === 'week' ? weekStart !== thisWeek : !onThisMonth

  return (
    <Page>
      <ScreenTitle
        aside={view === 'week' && title !== range ? range : undefined}
        action={
          elsewhere && (
            <Button variant="secondary" size="sm" onClick={backToNow}>
              {view === 'week' ? 'This week' : 'This month'}
            </Button>
          )
        }
      >
        {title}
      </ScreenTitle>

      <div className={styles.bar}>
        <IconButton
          ref={previousRef}
          icon="chevronLeft"
          label={view === 'week' ? 'Previous week' : 'Previous month'}
          variant="secondary"
          onClick={() => step(-1)}
        />
        <SegmentedControl label="View" options={VIEWS} value={view} onChange={changeView} />
        <IconButton
          icon="chevronRight"
          label={view === 'week' ? 'Next week' : 'Next month'}
          variant="secondary"
          onClick={() => step(1)}
        />
      </div>

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
              <div ref={outcomeRef} tabIndex={-1} className={styles.outcome}>
                <Notice
                  tone={outcome.tone}
                  onDismiss={() => setOutcome(null)}
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
            <Button size="lg" fullWidth disabled={!fill.canFill} aria-describedby={fillHintId} onClick={fillWeek}>
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
              showWeekOf(date)
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
