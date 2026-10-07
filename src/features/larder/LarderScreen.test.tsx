import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STARTER_LARDER } from '../../data'
import type { Ingredient } from '../../domain'
import { renderWithApp } from '../../test/render'
import { LarderScreen } from './LarderScreen'

const zaatar: Ingredient = { id: 'my-zaatar-x1y2z', name: "Za'atar", aisle: 'spices', growable: false }

const shelf = () => screen.getByRole('region', { name: 'In the larder' })
const adding = () => screen.getByRole('region', { name: 'Add to the larder' })
const browse = () => within(adding()).getByRole('group', { name: 'Browse by aisle' })

describe('LarderScreen', () => {
  it('starts empty, and "Add the usual suspects" fills the starter set', async () => {
    const { user, saved } = renderWithApp(<LarderScreen />)
    expect(screen.getByRole('heading', { name: 'Nothing in the larder yet' })).toBeInTheDocument()
    expect(screen.getByText(/search below for anything at all/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add the usual suspects' }))

    expect(saved()?.larder).toEqual(STARTER_LARDER)
    expect(within(shelf()).getByRole('button', { name: 'Olive oil', pressed: true })).toBeInTheDocument()
    expect(within(shelf()).getByRole('heading', { name: 'In the larder' })).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Nothing in the larder yet' })).not.toBeInTheDocument()
  })

  it('groups what is in the larder by aisle, in shop order', () => {
    renderWithApp(<LarderScreen />, { state: { larder: ['olive-oil', 'feta', 'onion', 'lemon', 'pasta'] } })
    const headings = within(shelf())
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual(['Veg', 'Fruit', 'Dairy and eggs', 'Dry goods', 'Oils and sauces'])
  })

  it('takes something out with a tap, and puts it straight back with another', async () => {
    const { user, saved } = renderWithApp(<LarderScreen />, { state: { larder: ['feta', 'lemon'] } })

    await user.click(within(shelf()).getByRole('button', { name: 'Feta', pressed: true }))
    expect(saved()?.larder).toEqual(['lemon'])
    // It stays where it was, un-ticked, so a slip is easy to undo.
    const feta = within(shelf()).getByRole('button', { name: 'Feta' })
    expect(feta).toHaveAttribute('aria-pressed', 'false')

    await user.click(feta)
    expect(saved()?.larder).toEqual(['lemon', 'feta'])
    expect(within(shelf()).getByRole('button', { name: 'Feta' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('searches everything except what is always assumed', async () => {
    const { user, saved } = renderWithApp(<LarderScreen />, { state: { larder: ['lemon'] } })
    const search = screen.getByRole('searchbox', { name: 'Search for anything' })

    await user.type(search, 'creme')
    const results = within(adding()).getByRole('list', { name: 'Search results' })
    await user.click(within(results).getByRole('button', { name: 'Crème fraîche', pressed: false }))
    expect(saved()?.larder).toEqual(['lemon', 'creme-fraiche'])
    expect(within(shelf()).getByRole('button', { name: 'Crème fraîche', pressed: true })).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'lemon')
    expect(within(adding()).getByRole('button', { name: 'Lemons' })).toHaveAttribute('aria-pressed', 'true')

    await user.clear(search)
    await user.type(search, 'salt')
    expect(within(adding()).getByRole('status')).toHaveTextContent('Nothing on the list matches that.')
  })

  it('browses by aisle, offering what is not in yet, grown things included', async () => {
    const { user, saved } = renderWithApp(<LarderScreen />, { state: { larder: ['cheddar'] } })

    await user.click(within(browse()).getByText('Dairy and eggs'))
    expect(within(browse()).queryByRole('button', { name: 'Cheddar' })).not.toBeInTheDocument()
    await user.click(within(browse()).getByRole('button', { name: 'Feta', pressed: false }))
    expect(saved()?.larder).toEqual(['cheddar', 'feta'])
    expect(within(shelf()).getByRole('button', { name: 'Feta', pressed: true })).toBeInTheDocument()
    // It stays ticked where it was tapped, keeping focus, until the next visit.
    const feta = within(browse()).getByRole('button', { name: 'Feta' })
    expect(feta).toHaveAttribute('aria-pressed', 'true')
    expect(feta).toHaveFocus()

    await user.click(within(browse()).getByText('Veg'))
    await user.click(within(browse()).getByRole('button', { name: 'Garlic' }))
    expect(saved()?.larder).toEqual(['cheddar', 'feta', 'garlic'])
    expect(within(browse()).queryByText('Salt')).not.toBeInTheDocument()
  })

  it("adds the person's own ingredient to the aisle they choose", async () => {
    const { user, saved } = renderWithApp(<LarderScreen />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), "Za'atar")
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aisle' }), 'Spices')
    await user.click(screen.getByRole('button', { name: 'Add to larder' }))

    const [mine] = saved()?.myIngredients ?? []
    expect(mine).toEqual({
      id: expect.stringMatching(/^my-zaatar-[a-z0-9]{5}$/),
      name: "Za'atar",
      aisle: 'spices',
      growable: false,
    })
    expect(saved()?.larder).toEqual([mine?.id])
    expect(screen.getByRole('status')).toHaveTextContent("Za'atar is in the larder.")
    const spices = within(shelf()).getByRole('heading', { name: 'Spices' })
    expect(spices).toBeInTheDocument()
    expect(within(shelf()).getByRole('button', { name: "Za'atar", pressed: true })).toBeInTheDocument()
  })

  it('asks for a name, and reuses an ingredient that is already on the list', async () => {
    const { user, saved } = renderWithApp(<LarderScreen />)
    await user.click(screen.getByRole('button', { name: 'Add to larder' }))
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Give it a name first.')

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'feta')
    await user.click(screen.getByRole('button', { name: 'Add to larder' }))
    expect(saved()?.myIngredients).toEqual([])
    expect(saved()?.larder).toEqual(['feta'])
    expect(screen.getByRole('status')).toHaveTextContent('Feta is in the larder.')
  })

  it("shows the person's own ingredients like any other, and skips unknown ids", () => {
    renderWithApp(<LarderScreen />, { state: { larder: [zaatar.id, 'long-gone'], myIngredients: [zaatar] } })
    expect(within(shelf()).getAllByRole('button').map((chip) => chip.textContent)).toEqual(["Za'atar"])
  })
})
