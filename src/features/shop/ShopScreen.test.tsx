import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../app/useStore'
import type { AppState, HarvestItem, MealPlan } from '../../domain'
import { announced, shown } from '../../test/live'
import { renderWithApp } from '../../test/render'
import { ShopScreen } from './ShopScreen'

// Wednesday 7 October 2026, so this week runs Monday 5 to Sunday 11 October.
const WEEK = '2026-10-05'

const ready = (ingredientId: string): HarvestItem => ({ ingredientId, status: 'ready', glut: false, addedOn: '2026-10-01' })

const PLAN: MealPlan = {
  '2026-10-06': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: false }],
  '2026-10-08': [
    { id: 'meal-2', recipeId: 'shakshuka', cooked: false },
    { id: 'meal-3', recipeId: 'recipe-that-was-deleted', cooked: false },
  ],
}

// Courgettes and tomatoes from the patch, onion and olive oil in the larder, so
// Ratatouille needs aubergine, pepper and garlic, and Shakshuka needs egg, pepper and garlic.
const PLANNED: Partial<AppState> = {
  harvest: [ready('courgette'), ready('tomato')],
  larder: ['onion', 'olive-oil'],
  plan: PLAN,
}

const aisle = (name: string) => screen.getByRole('region', { name })
const item = (name: string) => screen.getByRole('checkbox', { name })

function stubShare(share: (data: ShareData) => Promise<void>) {
  const spy = vi.fn(share)
  Object.defineProperty(navigator, 'share', { value: spy, configurable: true, writable: true })
  return spy
}

describe('ShopScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'share')
    window.location.hash = ''
  })

  it("lists what this week's meals need, by aisle, with the recipes each is for", () => {
    renderWithApp(<ShopScreen />, { state: PLANNED })

    expect(screen.getByRole('heading', { level: 1, name: 'Shopping list' })).toBeInTheDocument()
    expect(shown('This week, 5 to 11 October')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Veg',
      'Dairy and eggs',
    ])
    expect(within(aisle('Veg')).getAllByRole('checkbox')).toHaveLength(3)
    expect(item('Aubergines')).toHaveAccessibleDescription('for Ratatouille')
    expect(item('Garlic')).toHaveAccessibleDescription('for Ratatouille and Shakshuka')
    expect(item('Peppers')).toHaveAccessibleDescription('for Ratatouille and Shakshuka')
    expect(within(aisle('Dairy and eggs')).getByRole('checkbox', { name: 'Eggs' })).toHaveAccessibleDescription(
      'for Shakshuka',
    )
    // From the patch or the larder, so not on the list.
    expect(screen.queryByRole('checkbox', { name: 'Courgettes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Onions' })).not.toBeInTheDocument()
  })

  it('ticks things off and remembers it for the week', async () => {
    const { user, saved } = renderWithApp(<ShopScreen />, { state: PLANNED })
    const move = screen.getByRole('button', { name: 'Put ticked in the larder' })
    expect(move).toHaveAttribute('aria-disabled', 'true')
    expect(move).toHaveAccessibleDescription("Tick what you've bought first.")

    await user.click(item('Garlic'))
    expect(item('Garlic')).toBeChecked()
    expect(saved()?.shoppingTicks).toEqual({ [WEEK]: ['garlic'] })
    expect(move).not.toHaveAttribute('aria-disabled')
    expect(move).not.toHaveAccessibleDescription()
    expect(screen.queryByText("Tick what you've bought first.")).not.toBeInTheDocument()

    await user.click(item('Garlic'))
    expect(item('Garlic')).not.toBeChecked()
    expect(saved()?.shoppingTicks).toEqual({})
  })

  it('puts ticked things in the larder and says so', async () => {
    const { user, saved } = renderWithApp(<ShopScreen />, { state: PLANNED })
    await user.click(item('Garlic'))
    await user.click(item('Eggs'))
    await user.click(item('Peppers'))
    const move = screen.getByRole('button', { name: 'Put ticked in the larder' })
    await user.click(move)

    expect(shown('3 things put in the larder.')).toBeInTheDocument()
    expect(announced()).toEqual(['3 things put in the larder.'])
    // The button is still there (Aubergines are left), so focus stays on it.
    expect(move).toHaveFocus()
    expect(saved()?.larder).toEqual(['onion', 'olive-oil', 'garlic', 'egg', 'pepper'])
    expect(saved()?.shoppingTicks).toEqual({})
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(item('Aubergines')).not.toBeChecked()
  })

  it('names the one thing when only one is put away', async () => {
    const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
    await user.click(item('Aubergines'))
    await user.click(screen.getByRole('button', { name: 'Put ticked in the larder' }))
    expect(announced()).toEqual(['Aubergines put in the larder.'])
  })

  it('carries on from the heading once the last things are put away, and after the message is dismissed', async () => {
    const { user } = renderWithApp(<ShopScreen />, {
      state: { ...PLANNED, plan: { '2026-10-06': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: false }] } },
    })
    for (const name of ['Aubergines', 'Garlic', 'Peppers']) await user.click(item(name))
    await user.click(screen.getByRole('button', { name: 'Put ticked in the larder' }))

    expect(screen.getByRole('heading', { name: 'Nothing to buy' })).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 1, name: 'Shopping list' })
    expect(heading).toHaveFocus()

    screen.getByRole('button', { name: 'Dismiss' }).focus()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    expect(heading).toHaveFocus()
  })

  it('only puts away what is ticked on the list now, not ticks left from a meal taken off', async () => {
    function TakeOffShakshuka() {
      const { dispatch } = useStore()
      return (
        <button type="button" onClick={() => dispatch({ type: 'plan/remove', date: '2026-10-08', mealId: 'meal-2' })}>
          Take off Shakshuka
        </button>
      )
    }
    const { user, saved } = renderWithApp(
      <>
        <ShopScreen />
        <TakeOffShakshuka />
      </>,
      { state: PLANNED },
    )
    // Eggs are only for Shakshuka.
    await user.click(item('Eggs'))
    await user.click(screen.getByRole('button', { name: 'Take off Shakshuka' }))
    expect(screen.queryByRole('checkbox', { name: 'Eggs' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Put ticked in the larder' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(item('Garlic'))
    await user.click(screen.getByRole('button', { name: 'Put ticked in the larder' }))
    expect(saved()?.larder).toEqual(['onion', 'olive-oil', 'garlic'])
    expect(saved()?.shoppingTicks).toEqual({ [WEEK]: ['egg'] })
    expect(announced()).toEqual(['Garlic put in the larder.'])
  })

  describe('Share list', () => {
    it('uses the share sheet when there is one, leaving out ticked things', async () => {
      const share = stubShare(async () => {})
      const { user } = renderWithApp(<ShopScreen />, { state: { ...PLANNED, shoppingTicks: { [WEEK]: ['egg'] } } })
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(share).toHaveBeenCalledWith({
        title: 'Shopping for 5 to 11 October',
        text: 'Shopping for 5 to 11 October\n\nVeg\n- Aubergines\n- Garlic\n- Peppers',
      })
      expect(announced()).toEqual([])
    })

    it('says nothing when the share sheet is closed without sharing', async () => {
      stubShare(() => Promise.reject(new DOMException('Share cancelled', 'AbortError')))
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(announced()).toEqual([])
    })

    it('says so when sharing fails', async () => {
      stubShare(() => Promise.reject(new DOMException('Not allowed', 'NotAllowedError')))
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      await waitFor(() => expect(announced()).toEqual(["The list couldn't be shared. Try again in a moment."]))
      expect(shown("The list couldn't be shared. Try again in a moment.")).toBeInTheDocument()
    })

    it('copies to the clipboard when there is no share sheet', async () => {
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(writeText).toHaveBeenCalledWith(
        'Shopping for 5 to 11 October\n\nVeg\n- Aubergines\n- Garlic\n- Peppers\n\nDairy and eggs\n- Eggs',
      )
      await waitFor(() => expect(announced()).toEqual(['Copied to your clipboard.']))
      expect(shown('Copied to your clipboard.')).toBeInTheDocument()
    })

    it('says so when the clipboard refuses', async () => {
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      await waitFor(() => expect(announced()).toEqual(["The list couldn't be copied. This browser may not allow it."]))
    })
  })

  describe('when there is nothing to buy', () => {
    it('offers to plan the week when nothing is planned', async () => {
      const { user } = renderWithApp(<ShopScreen />)
      expect(screen.getByRole('heading', { name: 'Nothing planned this week' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Plan the week' }))
      expect(window.location.hash).toBe('#/week')
    })

    it("says it's all on the patch or in the larder", () => {
      renderWithApp(<ShopScreen />, {
        state: { ...PLANNED, larder: ['onion', 'olive-oil', 'garlic', 'egg', 'pepper', 'aubergine'] },
      })
      expect(screen.getByRole('heading', { name: 'Nothing to buy' })).toBeInTheDocument()
      expect(screen.getByText("It's all on the patch or in the larder.")).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share list' })).not.toBeInTheDocument()
    })

    it('says when everything planned has been cooked', () => {
      renderWithApp(<ShopScreen />, {
        state: { plan: { '2026-10-06': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: true }] } },
      })
      expect(screen.getByRole('heading', { name: 'Nothing left to buy' })).toBeInTheDocument()
    })
  })

  it('moves between weeks and back to this one', async () => {
    const { user } = renderWithApp(<ShopScreen />, {
      state: { ...PLANNED, plan: { ...PLAN, '2026-10-14': [{ id: 'meal-9', recipeId: 'gooseberry-fool', cooked: false }] } },
    })
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(shown('Next week, 12 to 18 October')).toBeInTheDocument()
    expect(announced()).toEqual(['Next week, 12 to 18 October'])
    expect(item('Gooseberries')).toHaveAccessibleDescription('for Gooseberry fool')
    expect(screen.queryByRole('checkbox', { name: 'Aubergines' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(shown('Last week, 28 September to 4 October')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nothing planned that week' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to this week' }))
    expect(shown('This week, 5 to 11 October')).toBeInTheDocument()
    await waitFor(() => expect(item('Aubergines')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toHaveFocus()
  })

  it('counts a week whose only meal is a recipe that has gone as nothing planned', () => {
    renderWithApp(<ShopScreen />, {
      state: { plan: { '2026-10-06': [{ id: 'meal-1', recipeId: 'recipe-that-was-deleted', cooked: false }] } },
    })
    expect(screen.getByRole('heading', { name: 'Nothing planned this week' })).toBeInTheDocument()
  })
})
