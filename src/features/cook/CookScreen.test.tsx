import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { AppState, HarvestItem, Recipe } from '../../domain'
import { announced } from '../../test/live'
import { renderWithApp } from '../../test/render'
import { CookScreen } from './CookScreen'

const ready = (ingredientId: string, glut = false): HarvestItem => ({
  ingredientId,
  status: 'ready',
  glut,
  addedOn: '2026-10-01',
})

const LARDER = ['olive-oil', 'garlic', 'onion', 'pasta', 'lemon', 'parmesan', 'butter', 'caster-sugar']

const flapjacks: Recipe = {
  id: 'my-flapjacks-a1b2c',
  title: "Dad's flapjacks",
  blurb: '',
  minutes: 40,
  serves: 12,
  course: 'bake',
  diet: ['vegetarian'],
  ingredients: [
    { id: 'oats', amount: '300g' },
    { id: 'butter', amount: '200g' },
  ],
  steps: ['Melt the butter.', 'Stir in the oats and bake.'],
}

const courgetteFritters: Recipe = {
  id: 'my-courgette-fritters-d4e5f',
  title: "Nan's courgette fritters",
  blurb: 'Crisp and quick.',
  minutes: 20,
  serves: 2,
  course: 'main',
  diet: ['vegetarian'],
  ingredients: [
    { id: 'courgette', amount: '2' },
    { id: 'egg', amount: '1' },
  ],
  steps: ['Grate the courgettes.', 'Fry spoonfuls in hot oil.'],
}

function renderCook(state: Partial<AppState> = {}) {
  return renderWithApp(<CookScreen />, { state: { harvest: [ready('courgette')], larder: LARDER, ...state } })
}

const card = (name: string) => screen.queryByRole('button', { name })

describe('CookScreen', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('lists recipes using the patch in two sections, best first', () => {
    renderCook()
    expect(screen.getByRole('heading', { level: 1, name: 'What to cook' })).toBeInTheDocument()

    const meals = within(screen.getByRole('region', { name: 'Meals' }))
    const mealTitles = meals.getAllByRole('button').map((button) => button.textContent)
    expect(mealTitles[0]).toContain('Lemony courgette spaghetti')
    expect(meals.getByRole('button', { name: 'Ratatouille' })).toBeInTheDocument()

    const treats = within(screen.getByRole('region', { name: 'Bakes, puddings and preserves' }))
    expect(treats.getByRole('button', { name: 'Courgette and lemon drizzle cake' })).toBeInTheDocument()
    expect(treats.getByRole('button', { name: 'Courgette chutney' })).toBeInTheDocument()
    expect(treats.queryByRole('button', { name: 'Ratatouille' })).not.toBeInTheDocument()
  })

  it('shows what each card needs, with names lower-cased', () => {
    renderCook()
    expect(card('Lemony courgette spaghetti')).toHaveAccessibleDescription(/Ready to cook/)
    expect(card('Ratatouille')).toHaveAccessibleDescription(/You'll need: aubergines, peppers/)
  })

  it('filters to ready to cook, veggie and back to all', async () => {
    const { user } = renderCook()

    await user.click(screen.getByRole('radio', { name: 'Ready to cook' }))
    expect(card('Lemony courgette spaghetti')).toBeInTheDocument()
    expect(card('Ratatouille')).not.toBeInTheDocument()
    // How many are left is read out, as the list changes out of sight.
    const shownCount = screen.getAllByRole('button', { name: /./ }).filter((button) => button.closest('li')).length
    expect(announced()).toEqual([`${shownCount} ${shownCount === 1 ? 'recipe' : 'recipes'}.`])

    await user.click(screen.getByRole('radio', { name: 'Veggie' }))
    expect(card('Ratatouille')).toBeInTheDocument()
    expect(card('Prawn, courgette and chilli spaghetti')).not.toBeInTheDocument()
    expect(card('Baked courgettes with spiced beef and mozzarella')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'All' }))
    expect(card('Prawn, courgette and chilli spaghetti')).toBeInTheDocument()
  })

  it('shows all of your own recipes under Mine, quietly marking ones with nothing from the patch', async () => {
    const { user } = renderCook({ myRecipes: [flapjacks, courgetteFritters] })
    await user.click(screen.getByRole('radio', { name: 'Mine' }))

    expect(card("Nan's courgette fritters")).toHaveAccessibleDescription(/You'll need|Ready to cook/)
    expect(card("Dad's flapjacks")).toHaveAccessibleDescription(/Nothing from the patch yet/)
    expect(card('Ratatouille')).not.toBeInTheDocument()
  })

  it('only shows recipes with the ingredient the Patch screen linked to, until cleared', async () => {
    window.location.hash = '#/cook?with=courgette'
    const { user } = renderCook({ harvest: [ready('courgette'), ready('kale')] })

    expect(screen.getByText('With courgettes')).toBeInTheDocument()
    expect(card('Ratatouille')).toBeInTheDocument()
    expect(card('Kale and white bean stew')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show all, not just courgettes' }))
    await waitFor(() => expect(window.location.hash).toBe('#/cook'))
    expect(await screen.findByRole('button', { name: 'Kale and white bean stew' })).toBeInTheDocument()
    expect(screen.queryByText('With courgettes')).not.toBeInTheDocument()
  })

  it('shows a few of a long list first, then the rest on request', async () => {
    const harvest = ['courgette', 'tomato', 'kale', 'beetroot', 'leek', 'potato'].map((id) => ready(id))
    const { user } = renderCook({ harvest })
    const meals = within(screen.getByRole('region', { name: 'Meals' }))
    expect(meals.getAllByRole('listitem')).toHaveLength(8)

    await user.click(meals.getByRole('button', { name: /^Show \d+ more meals$/ }))
    expect(meals.getAllByRole('listitem').length).toBeGreaterThan(8)
    expect(meals.queryByRole('button', { name: /more meals/ })).not.toBeInTheDocument()
  })

  it('invites you to the patch when nothing is on it', async () => {
    const { user } = renderCook({ harvest: [] })
    expect(screen.getByRole('heading', { name: 'Nothing on the patch yet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Go to the patch' }))
    await waitFor(() => expect(window.location.hash).toBe('#/patch'))
  })

  it('suggests writing a recipe when nothing uses what is on the patch', () => {
    const kohlrabi = {
      id: 'my-kohlrabi-k1k2k',
      name: 'Kohlrabi',
      aisle: 'veg' as const,
      growable: true,
      art: 'seedling' as const,
      harvestMonths: [],
    }
    renderCook({ harvest: [ready(kohlrabi.id)], myIngredients: [kohlrabi] })
    expect(screen.getByRole('heading', { name: 'No recipes use your patch yet' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Write a recipe' })).toHaveLength(2)
  })

  it('says so when a filter leaves nothing', async () => {
    const { user } = renderCook({ harvest: [ready('kale')] })
    await user.click(screen.getByRole('radio', { name: 'Ready to cook' }))
    expect(screen.getByRole('heading', { name: 'Nothing is ready to cook as it is' })).toBeInTheDocument()
    expect(announced()).toEqual(['No recipes to show.'])

    await user.click(screen.getByRole('radio', { name: 'Mine' }))
    expect(screen.getByRole('heading', { name: 'No recipes of your own yet' })).toBeInTheDocument()
  })

  it('ignores a link to an ingredient the app does not know, rather than showing its words', () => {
    window.location.hash = '#/cook?with=%3Cb%3EFree%20money%3C%2Fb%3E'
    renderCook()
    expect(screen.queryByText(/Free money/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show all, not just/ })).not.toBeInTheDocument()
    expect(card('Ratatouille')).toBeInTheDocument()
  })

  it('opens the recipe when a card is tapped', async () => {
    const { user } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    expect(screen.getByRole('dialog', { name: 'Ratatouille' })).toBeInTheDocument()
  })
})
