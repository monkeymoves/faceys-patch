import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState, HarvestItem, MealPlan } from '../../domain'
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

const day = (name: string) => screen.getByRole('region', { name })
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
    expect(title()).toHaveTextContent('This week')
    expect(screen.getByText('5 to 11 October')).toBeInTheDocument()

    const days = screen.getAllByRole('region')
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveAccessibleName('Monday 5 October')
    expect(days[6]).toHaveAccessibleName('Sunday 11 October')
    expect(day('Wednesday 7 October, today')).toHaveAttribute('aria-current', 'date')
    expect(day('Monday 5 October').className).toMatch(/past/)
    expect(day('Thursday 8 October').className).not.toMatch(/past/)
  })

  it('moves to the next and previous weeks and back to this week', async () => {
    const { user } = renderWeek()
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(title()).toHaveTextContent('Next week')
    expect(screen.getByText('12 to 18 October')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'This week' }))
    expect(title()).toHaveTextContent('This week')
    expect(screen.queryByRole('button', { name: 'This week' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(title()).toHaveTextContent('Last week')
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(title()).toHaveTextContent('21 to 27 September')
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
    await user.click(screen.getByRole('button', { name: 'Take off this day' }))

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
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent("Planned 4 dinners from what's ready.")
    expect(status.parentElement).toHaveFocus()

    const fill = screen.getByRole('button', { name: 'Fill my week' })
    expect(fill).toBeDisabled()
    expect(fill).toHaveAccessibleDescription('Every day from today already has a meal.')
  })

  it('says when it runs out of ideas part way', async () => {
    const { user, saved } = renderWeek({ harvest: [ready('kale')] })
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))
    expect(Object.keys(saved()?.plan ?? {})).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent(
      "Planned 2 dinners from what's ready. That's all the ideas for now.",
    )
  })

  it('says why nothing could be planned', async () => {
    const { user, saved } = renderWeek({ harvest: [] })
    await user.click(screen.getByRole('button', { name: 'Fill my week' }))
    expect(saved()?.plan).toEqual({})
    expect(screen.getByRole('status')).toHaveTextContent("There's nothing on the patch yet")
    await user.click(screen.getByRole('button', { name: 'Go to the patch' }))
    await waitFor(() => expect(window.location.hash).toBe('#/patch'))
  })

  it('cannot fill a week that is over, and fills the whole of a future week', async () => {
    const { user, saved } = renderWeek()
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    const fill = screen.getByRole('button', { name: 'Fill my week' })
    expect(fill).toBeDisabled()
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

    expect(title()).toHaveTextContent('October 2026')
    expect(screen.getByRole('button', { name: 'Wednesday 7 October, today, nothing planned' })).toHaveAttribute(
      'aria-current',
      'date',
    )
    expect(screen.getByRole('button', { name: 'Monday 28 September, nothing planned' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wednesday 14 October, 1 meal planned' }))
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked()
    expect(title()).toHaveTextContent('Next week')
    expect(within(day('Wednesday 14 October')).getByRole('button', { name: 'Ratatouille' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a meal to Wednesday 14 October' })).toHaveFocus()
  })

  it('moves between months on its own', async () => {
    const { user } = renderWeek()
    await user.click(screen.getByRole('radio', { name: 'Month' }))
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(title()).toHaveTextContent('November 2026')
    expect(screen.getByRole('button', { name: 'Monday 30 November, nothing planned' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'This month' }))
    expect(title()).toHaveTextContent('October 2026')
  })
})
