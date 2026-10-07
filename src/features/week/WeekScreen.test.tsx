import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState, HarvestItem, MealPlan } from '../../domain'
import { announced, shown } from '../../test/live'
import { renderWithApp } from '../../test/render'
import { WeekScreen } from './WeekScreen'

const ready = (ingredientId: string): HarvestItem => ({
  ingredientId,
  status: 'ready',
  glut: false,
  addedOn: '2026-10-01',
})

const LARDER = ['olive-oil', 'garlic', 'onion', 'pasta', 'lemon', 'parmesan', 'butter']
const PATCH = ['courgette', 'tomato', 'kale', 'beetroot', 'leek'].map(ready)

function renderWeek(state: Partial<AppState> = {}) {
  return renderWithApp(<WeekScreen />, { state: { harvest: PATCH, larder: LARDER, ...state } })
}

/** A day card: the list item under its h2. */
const day = (name: string) => {
  const item = screen.getByRole('heading', { level: 2, name }).closest('li')
  if (!item) throw new Error(`No list item for ${name}`)
  return item
}
const title = () => screen.getByRole('heading', { level: 1 })

describe('WeekScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12)) // Wednesday 7 October 2026
  })

  afterEach(() => {
    vi.useRealTimers()
    window.location.hash = ''
  })

  it('shows seven days from Monday, with today marked and past days marked past', () => {
    renderWeek()
    expect(title()).toHaveTextContent("What's for dinner")
    // In plain text, not only the handwritten face.
    expect(shown('This week, 5 to 11 October')).toBeInTheDocument()

    // Each day is a list item with an h2 under the h1, not a landmark of its own.
    expect(screen.queryAllByRole('region')).toHaveLength(0)
    const days = screen.getAllByRole('heading', { level: 2 })
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveAccessibleName('Monday 5 October')
    expect(days[6]).toHaveAccessibleName('Sunday 11 October')
    const today = day('Wednesday 7 October, today').firstElementChild
    expect(today).toHaveAttribute('aria-current', 'date')
    expect(day('Monday 5 October').firstElementChild?.className).toMatch(/past/)
    expect(day('Thursday 8 October').firstElementChild?.className).not.toMatch(/past/)
  })

  it('moves to the next and previous weeks and back to this week, saying where it is', async () => {
    const { user } = renderWeek()
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(shown('Next week, 12 to 18 October')).toBeInTheDocument()
    expect(announced()).toEqual(['Next week, 12 to 18 October'])

    await user.click(screen.getByRole('button', { name: 'Back to this week' }))
    expect(shown('This week, 5 to 11 October')).toBeInTheDocument()
    expect(announced()).toEqual(['This week, 5 to 11 October'])
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(shown('Last week, 28 September to 4 October')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(shown('2 weeks ago, 21 to 27 September')).toBeInTheDocument()
  })

  it('hides a meal whose recipe has gone, and counts its day as empty', async () => {
    const plan: MealPlan = {
      '2026-10-08': [{ id: 'meal-gone', recipeId: 'recipe-that-was-deleted', cooked: false }],
      '2026-10-09': [{ id: 'meal-1', recipeId: 'shakshuka', cooked: false }],
      '2026-10-10': [{ id: 'meal-2', recipeId: 'ratatouille', cooked: false }],
      '2026-10-11': [{ id: 'meal-3', recipeId: 'lemony-courgette-spaghetti', cooked: false }],
      '2026-10-07': [{ id: 'meal-4', recipeId: 'roasted-tomato-soup', cooked: false }],
    }
    const { user, saved } = renderWeek({ plan })
    expect(within(day('Thursday 8 October')).getByText('Nothing planned yet')).toBeInTheDocument()

    const fill = screen.getByRole('button', { name: 'Fill my week' })
    expect(fill).not.toHaveAttribute('aria-disabled')
    await user.click(fill)
    const thursday = saved()?.plan['2026-10-08'] ?? []
    expect(thursday).toHaveLength(2)
    expect(within(day('Thursday 8 October')).getAllByRole('button', { name: /./ })).toHaveLength(2)
    expect(announced()).toEqual(["Planned 1 dinner from what's ready."])
  })

  it('adds a meal from the best matches, dinners first', async () => {
    const { user, saved } = renderWeek({ harvest: [ready('courgette')] })
    await user.click(screen.getByRole('button', { name: 'Add a meal to Thursday 8 October' }))

    const picker = within(screen.getByRole('dialog', { name: "What's for Thursday?" }))
    const best = within(picker.getByRole('region', { name: 'Best from the patch' }))
    const titles = best.getAllByRole('button').map((button) => button.textContent ?? '')
    expect(titles[0]).toContain('Lemony courgette spaghetti')
    const cake = titles.findIndex((text) => text.includes('Courgette and lemon drizzle cake'))
    const wraps = titles.findIndex((text) => text.includes('Halloumi and courgette wraps'))
    expect(cake).toBeGreaterThan(wraps)

    await user.click(best.getByRole('button', { name: 'Ratatouille' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(day('Thursday 8 October')).getByRole('button', { name: 'Ratatouille' })).toBeInTheDocument()
    expect(saved()?.plan['2026-10-08']).toEqual([
      { id: expect.stringMatching(/^meal-/), recipeId: 'ratatouille', cooked: false },
    ])
  })

  it('searches every recipe in the picker, matched or not', async () => {
    const { user, saved } = renderWeek({ harvest: [ready('courgette')] })
    await user.click(screen.getByRole('button', { name: 'Add a meal to Saturday 10 October' }))
    const picker = within(screen.getByRole('dialog', { name: "What's for Saturday?" }))
    await user.type(picker.getByRole('searchbox', { name: 'Search all recipes' }), 'summer pud')
    const found = picker.getByRole('button', { name: 'Summer pudding' })
    await waitFor(() => expect(announced(screen.getByRole('dialog'))).toEqual(['1 recipe found.']))
    expect(found).toHaveAccessibleDescription(/Nothing from the patch/)
    await user.click(found)
    expect(saved()?.plan['2026-10-10']?.[0]?.recipeId).toBe('summer-pudding')
  })

  it('marks a planned meal cooked, and back again', async () => {
    const plan: MealPlan = { '2026-10-07': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: false }] }
    const { user, saved } = renderWeek({ plan })
    await user.click(within(day('Wednesday 7 October, today')).getByRole('button', { name: 'Ratatouille' }))
    const view = within(screen.getByRole('dialog', { name: 'Ratatouille' }))
    expect(view.getByText('On the plan for Wednesday 7 October')).toBeInTheDocument()
    await user.click(view.getByRole('button', { name: 'Mark as cooked' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(saved()?.plan['2026-10-07']?.[0]?.cooked).toBe(true)
    const meal = within(day('Wednesday 7 October, today')).getByRole('button', { name: /Ratatouille/ })
    expect(meal).toHaveTextContent('Cooked')

    await user.click(meal)
    await user.click(screen.getByRole('button', { name: 'Not cooked yet' }))
    expect(saved()?.plan['2026-10-07']?.[0]?.cooked).toBe(false)
  })

  it('takes a meal off its day', async () => {
    const plan: MealPlan = {
      '2026-10-08': [
        { id: 'meal-1', recipeId: 'ratatouille', cooked: false },
        { id: 'meal-2', recipeId: 'shakshuka', cooked: false },
      ],
    }
    const { user, saved } = renderWeek({ plan })
    await user.click(within(day('Thursday 8 October')).getByRole('button', { name: 'Ratatouille' }))
    await user.click(screen.getByRole('button', { name: 'Take it off this day' }))

    expect(within(day('Thursday 8 October')).queryByRole('button', { name: 'Ratatouille' })).not.toBeInTheDocument()
    expect(saved()?.plan['2026-10-08']).toEqual([{ id: 'meal-2', recipeId: 'shakshuka', cooked: false }])
  })

  it('fills only the empty days from today and says what it did', async () => {
    const plan: MealPlan = { '2026-10-07': [{ id: 'meal-1', recipeId: 'shakshuka', cooked: false }] }
    const { user, saved } = renderWeek({ plan })
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))

    const after = saved()?.plan ?? {}
    expect(Object.keys(after).sort()).toEqual(['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
    expect(after['2026-10-07']).toEqual(plan['2026-10-07'])
    for (const date of ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']) expect(after[date]).toHaveLength(1)
    expect(shown("Planned 4 dinners from what's ready.")).toBeInTheDocument()
    expect(announced()).toEqual(["Planned 4 dinners from what's ready."])

    // Still focused, and saying why there's nothing more to do.
    const fill = screen.getByRole('button', { name: 'Fill my week' })
    expect(fill).toHaveFocus()
    expect(fill).toHaveAttribute('aria-disabled', 'true')
    expect(fill).toHaveAccessibleDescription('Every day from today already has a meal.')
    await user.click(fill)
    expect(saved()?.plan).toEqual(after)

    // Dismissing the message carries on from the top of the screen, not the page.
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }))
    expect(screen.queryByRole('button', { name: 'Dismiss message' })).not.toBeInTheDocument()
    expect(title()).toHaveFocus()
  })

  it('says when it runs out of ideas part way', async () => {
    const { user, saved } = renderWeek({ harvest: [ready('kale')] })
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))
    expect(Object.keys(saved()?.plan ?? {})).toHaveLength(2)
    expect(announced()).toEqual(["Planned 2 dinners from what's ready. That's all the ideas for now."])
  })

  it('says why nothing could be planned', async () => {
    const { user, saved } = renderWeek({ harvest: [] })
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))
    expect(saved()?.plan).toEqual({})
    expect(shown(/There's nothing on the patch yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Go to the patch' }))
    await waitFor(() => expect(window.location.hash).toBe('#/patch'))
  })

  it('cannot fill a week that is over, and fills the whole of a future week', async () => {
    const { user, saved } = renderWeek()
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    const fill = screen.getByRole('button', { name: 'Fill my week' })
    expect(fill).toHaveAttribute('aria-disabled', 'true')
    expect(fill).toHaveAccessibleDescription("This week's been and gone.")

    await user.click(screen.getByRole('button', { name: 'Next week' }))
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))
    expect(Object.keys(saved()?.plan ?? {}).sort()).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
  })

  it('shows the month with planned days marked, and jumps to the week of a tapped day', async () => {
    const plan: MealPlan = { '2026-10-14': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: false }] }
    const { user } = renderWeek({ plan })
    await user.click(screen.getByRole('radio', { name: 'Month' }))

    expect(shown('October 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wednesday 7 October, today, nothing planned' })).toHaveAttribute(
      'aria-current',
      'date',
    )
    expect(screen.getByRole('button', { name: 'Monday 28 September, nothing planned' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wednesday 14 October, 1 meal planned' }))
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked()
    expect(shown('Next week, 12 to 18 October')).toBeInTheDocument()
    expect(within(day('Wednesday 14 October')).getByRole('button', { name: 'Ratatouille' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a meal to Wednesday 14 October' })).toHaveFocus()
  })

  it('moves between months on its own', async () => {
    const { user } = renderWeek()
    await user.click(screen.getByRole('radio', { name: 'Month' }))
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(shown('November 2026')).toBeInTheDocument()
    expect(announced()).toEqual(['November 2026'])
    expect(screen.getByRole('button', { name: 'Monday 30 November, nothing planned' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to this month' }))
    expect(shown('October 2026')).toBeInTheDocument()
  })

  it('makes the month one tab stop, moved round with the arrow keys', async () => {
    const { user } = renderWeek()
    await user.click(screen.getByRole('radio', { name: 'Month' }))
    const days = screen.getAllByRole('button', { name: /planned$/ })
    expect(days.filter((button) => button.tabIndex === 0)).toHaveLength(1)
    const today = screen.getByRole('button', { name: 'Wednesday 7 October, today, nothing planned' })
    expect(today).toHaveAttribute('tabindex', '0')

    today.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Thursday 8 October, nothing planned' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Thursday 15 October, nothing planned' })).toHaveFocus()
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('button', { name: 'Thursday 1 October, nothing planned' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Wednesday 30 September, nothing planned' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'Monday 28 September, nothing planned' })).toHaveFocus()
    await user.keyboard('{End}')
    const sunday = screen.getByRole('button', { name: 'Sunday 4 October, nothing planned' })
    expect(sunday).toHaveFocus()
    expect(sunday).toHaveAttribute('tabindex', '0')
    expect(today).toHaveAttribute('tabindex', '-1')
    // Off the top of the grid it stays put.
    await user.keyboard('{ArrowUp}')
    expect(sunday).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(shown('Last week, 28 September to 4 October')).toBeInTheDocument()
  })
})
