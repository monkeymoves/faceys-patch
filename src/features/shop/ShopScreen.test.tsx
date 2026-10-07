import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState, HarvestItem, MealPlan } from '../../domain'
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

    expect(screen.getByRole('heading', { level: 1, name: 'Shopping' })).toBeInTheDocument()
    expect(screen.getByText('5 to 11 October')).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Put ticked in the larder' })).toBeDisabled()

    await user.click(item('Garlic'))
    expect(item('Garlic')).toBeChecked()
    expect(saved()?.shoppingTicks).toEqual({ [WEEK]: ['garlic'] })

    await user.click(item('Garlic'))
    expect(item('Garlic')).not.toBeChecked()
    expect(saved()?.shoppingTicks).toEqual({})
  })

  it('puts ticked things in the larder and says so', async () => {
    const { user, saved } = renderWithApp(<ShopScreen />, { state: PLANNED })
    await user.click(item('Garlic'))
    await user.click(item('Eggs'))
    await user.click(item('Peppers'))
    await user.click(screen.getByRole('button', { name: 'Put ticked in the larder' }))

    expect(screen.getByRole('status')).toHaveTextContent('3 things put in the larder')
    expect(screen.getByRole('status').parentElement).toHaveFocus()
    expect(saved()?.larder).toEqual(['onion', 'olive-oil', 'garlic', 'egg', 'pepper'])
    expect(saved()?.shoppingTicks).toEqual({})
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(item('Aubergines')).not.toBeChecked()
  })

  it('names the one thing when only one is put away', async () => {
    const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
    await user.click(item('Aubergines'))
    await user.click(screen.getByRole('button', { name: 'Put ticked in the larder' }))
    expect(screen.getByRole('status')).toHaveTextContent('Aubergines put in the larder')
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
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('says nothing when the share sheet is closed without sharing', async () => {
      stubShare(() => Promise.reject(new DOMException('Share cancelled', 'AbortError')))
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('says so when sharing fails', async () => {
      stubShare(() => Promise.reject(new DOMException('Not allowed', 'NotAllowedError')))
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(await screen.findByRole('alert')).toHaveTextContent("The list couldn't be shared.")
    })

    it('copies to the clipboard when there is no share sheet', async () => {
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(writeText).toHaveBeenCalledWith(
        'Shopping for 5 to 11 October\n\nVeg\n- Aubergines\n- Garlic\n- Peppers\n\nDairy and eggs\n- Eggs',
      )
      expect(await screen.findByRole('status')).toHaveTextContent('Copied to your clipboard')
    })

    it('says so when the clipboard refuses', async () => {
      const { user } = renderWithApp(<ShopScreen />, { state: PLANNED })
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
      await user.click(screen.getByRole('button', { name: 'Share list' }))

      expect(await screen.findByRole('alert')).toHaveTextContent("The list couldn't be copied.")
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
    expect(screen.queryByRole('button', { name: 'This week' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByText('12 to 18 October')).toBeInTheDocument()
    expect(screen.getByText('Next week', { selector: 'p' })).toBeInTheDocument()
    expect(item('Gooseberries')).toHaveAccessibleDescription('for Gooseberry fool')
    expect(screen.queryByRole('checkbox', { name: 'Aubergines' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(screen.getByText('28 September to 4 October')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nothing planned that week' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'This week' }))
    expect(screen.getByText('5 to 11 October')).toBeInTheDocument()
    await waitFor(() => expect(item('Aubergines')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'This week' })).not.toBeInTheDocument()
  })
})
