import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HarvestItem, Ingredient } from '../../domain'
import { announced, shown } from '../../test/live'
import { renderWithApp } from '../../test/render'
import { PatchScreen } from './PatchScreen'

const crop = (ingredientId: string, status: HarvestItem['status'] = 'ready', glut = false): HarvestItem => ({
  ingredientId,
  status,
  glut,
  addedOn: '2026-10-01',
})

const oca: Ingredient = {
  id: 'my-oca-ab12c',
  name: 'Oca',
  aisle: 'veg',
  growable: true,
  art: 'seedling',
  harvestMonths: [],
}

async function openPicker(user: ReturnType<typeof renderWithApp>['user']) {
  // The header's Add, or on an empty patch the empty state's own button.
  const add = screen.queryByRole('button', { name: 'Add' }) ?? screen.getByRole('button', { name: "Add what's ready" })
  await user.click(add)
  return screen.getByRole('dialog', { name: 'Add to the patch' })
}

describe('PatchScreen', () => {
  beforeEach(() => {
    // Only the clock is faked, so userEvent's own timers still run.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    window.location.hash = ''
  })

  describe('when nothing is on the patch', () => {
    it('says so kindly and offers what is in season as quick-add tiles', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />)
      expect(screen.getByRole('heading', { name: 'Nothing picked yet' })).toBeInTheDocument()

      const suggestions = screen.getByRole('region', { name: 'In season in October' })
      const tiles = within(suggestions).getAllByRole('button')
      expect(tiles).toHaveLength(6)
      expect(tiles.map((tile) => tile.getAttribute('aria-label'))).toContain('Add Aubergines')

      await user.click(within(suggestions).getByRole('button', { name: 'Add Aubergines' }))

      expect(saved()?.harvest).toEqual([
        { ingredientId: 'aubergine', status: 'ready', glut: false, addedOn: '2026-10-07' },
      ])
      expect(announced()).toContain('Added aubergines to the patch.')
      const readyNow = screen.getByRole('region', { name: 'Ready now' })
      expect(within(readyNow).getByRole('button', { name: 'Aubergines, ready now' })).toHaveFocus()
      expect(screen.queryByRole('heading', { name: 'Nothing picked yet' })).not.toBeInTheDocument()
    })

    it('offers one way to add, not two', () => {
      renderWithApp(<PatchScreen />)
      expect(screen.getByRole('button', { name: "Add what's ready" })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
      expect(screen.getByText("Add what's ready on the plot and recipes that use it will turn up.")).toBeInTheDocument()
    })

    it('opens the picker from "Add what\'s ready"', async () => {
      const { user } = renderWithApp(<PatchScreen />)
      await user.click(screen.getByRole('button', { name: "Add what's ready" }))
      expect(screen.getByRole('dialog', { name: 'Add to the patch' })).toBeInTheDocument()
    })

    it('skips crops the app no longer knows about', () => {
      renderWithApp(<PatchScreen />, { state: { harvest: [crop('long-gone-veg')] } })
      expect(screen.getByRole('heading', { name: 'Nothing picked yet' })).toBeInTheDocument()
    })
  })

  describe('with crops on the patch', () => {
    it('groups them into ready now and coming soon, A to Z', () => {
      renderWithApp(<PatchScreen />, {
        state: { harvest: [crop('tomato'), crop('leek', 'soon'), crop('courgette', 'ready', true), crop('beetroot')] },
      })

      const readyNow = screen.getByRole('region', { name: 'Ready now' })
      expect(within(readyNow).getAllByRole('button').map((tile) => tile.getAttribute('aria-label'))).toEqual([
        'Beetroot, ready now',
        'Courgettes, ready now, loads of it',
        'Tomatoes, ready now',
      ])
      const comingSoon = screen.getByRole('region', { name: 'Coming soon' })
      expect(within(comingSoon).getByRole('button', { name: 'Leeks, coming soon' })).toBeInTheDocument()
    })

    it('hides a group with nothing in it', () => {
      renderWithApp(<PatchScreen />, { state: { harvest: [crop('tomato')] } })
      expect(screen.queryByRole('region', { name: 'Coming soon' })).not.toBeInTheDocument()
    })

    it('links quietly to Cook', async () => {
      const { user } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('tomato')] } })
      await user.click(screen.getByRole('button', { name: 'See what you can cook' }))
      expect(window.location.hash).toBe('#/cook')
    })
  })

  describe('the crop sheet', () => {
    it('changes how ready it is and marks a glut', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('courgette')] } })
      await user.click(screen.getByRole('button', { name: 'Courgettes, ready now' }))
      const sheet = screen.getByRole('dialog', { name: 'Courgettes' })

      expect(within(sheet).getByRole('radio', { name: 'Ready now' })).toBeChecked()
      await user.click(within(sheet).getByRole('radio', { name: 'Coming soon' }))
      expect(saved()?.harvest[0]).toMatchObject({ ingredientId: 'courgette', status: 'soon', glut: false })

      await user.click(within(sheet).getByRole('checkbox', { name: 'Loads of it' }))
      expect(saved()?.harvest[0]).toMatchObject({ status: 'soon', glut: true })

      await user.click(within(sheet).getByRole('button', { name: 'Close' }))
      const comingSoon = screen.getByRole('region', { name: 'Coming soon' })
      expect(
        within(comingSoon).getByRole('button', { name: 'Courgettes, coming soon, loads of it' }),
      ).toBeInTheDocument()
    })

    it('takes a crop off the patch in one tap, and says so with a way to undo it', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('courgette')] } })
      await user.click(screen.getByRole('button', { name: 'Courgettes, ready now' }))
      await user.click(screen.getByRole('button', { name: 'Take it off the patch' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(saved()?.harvest).toEqual([])
      expect(screen.getByRole('heading', { name: 'Nothing picked yet' })).toBeInTheDocument()
      expect(shown('Took courgettes off the patch.')).toBeInTheDocument()
      expect(announced()).toContain('Took courgettes off the patch.')
      // The tile has gone, so focus lands on the likeliest next move.
      await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus())
    })

    it('puts a crop back exactly as it was on Undo', async () => {
      const glutted: HarvestItem = { ingredientId: 'courgette', status: 'soon', glut: true, addedOn: '2026-09-12' }
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('kale'), glutted] } })
      await user.click(screen.getByRole('button', { name: 'Courgettes, coming soon, loads of it' }))
      await user.click(screen.getByRole('button', { name: 'Take it off the patch' }))
      expect(saved()?.harvest).toEqual([crop('kale')])

      await user.click(screen.getByRole('button', { name: 'Undo' }))
      expect(saved()?.harvest).toEqual([crop('kale'), glutted])
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
      expect(announced()).toContain('Put courgettes back on the patch.')
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Courgettes, coming soon, loads of it' })).toHaveFocus(),
      )
    })

    it('explains "Loads of it" as a glut', async () => {
      const { user } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('courgette')] } })
      await user.click(screen.getByRole('button', { name: 'Courgettes, ready now' }))
      expect(screen.getByRole('checkbox', { name: 'Loads of it' })).toHaveAccessibleDescription(
        'A glut. Recipes that use it up come first.',
      )
    })

    it('goes to Cook with recipes using that crop', async () => {
      const { user } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('courgette')] } })
      await user.click(screen.getByRole('button', { name: 'Courgettes, ready now' }))
      await user.click(screen.getByRole('button', { name: 'See recipes with courgettes' }))

      expect(window.location.hash).toBe('#/cook?with=courgette')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('the Add picker', () => {
    it('adds several crops, each with the chosen status, then Done', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('tomato')] } })
      const picker = await openPicker(user)

      expect(within(picker).getByRole('button', { name: 'Tomatoes' })).toHaveAttribute('aria-pressed', 'true')
      await user.click(within(picker).getByRole('button', { name: 'Kale', pressed: false }))
      expect(announced(picker)).toEqual(['Added kale to the patch.'])
      await user.click(within(picker).getByRole('button', { name: 'Leeks', pressed: false }))
      await user.click(within(picker).getByRole('radio', { name: 'Coming soon' }))
      await user.click(within(picker).getByRole('button', { name: 'Squash', pressed: false }))

      expect(within(picker).getByRole('button', { name: 'Kale' })).toHaveAttribute('aria-pressed', 'true')
      expect(saved()?.harvest.map(({ ingredientId, status }) => [ingredientId, status])).toEqual([
        ['tomato', 'ready'],
        ['kale', 'ready'],
        ['leek', 'ready'],
        ['squash', 'soon'],
      ])

      await user.click(within(picker).getByRole('button', { name: 'Done' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      const readyNow = screen.getByRole('region', { name: 'Ready now' })
      expect(within(readyNow).getByRole('button', { name: 'Kale, ready now' })).toBeInTheDocument()
      const comingSoon = screen.getByRole('region', { name: 'Coming soon' })
      expect(within(comingSoon).getByRole('button', { name: 'Squash, coming soon' })).toBeInTheDocument()
    })

    it('takes a crop off when its chip is tapped again', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('tomato'), crop('kale')] } })
      const picker = await openPicker(user)
      await user.click(within(picker).getByRole('button', { name: 'Tomatoes', pressed: true }))

      expect(within(picker).getByRole('button', { name: 'Tomatoes' })).toHaveAttribute('aria-pressed', 'false')
      expect(saved()?.harvest.map((item) => item.ingredientId)).toEqual(['kale'])
      expect(announced(picker)).toEqual(['Took tomatoes off the patch.'])
    })

    it("lists this month's crops first, then everything else A to Z, including the person's own", async () => {
      const { user } = renderWithApp(<PatchScreen />, { state: { myIngredients: [oca] } })
      const picker = await openPicker(user)

      const seasonal = within(picker).getByRole('region', { name: 'In season in October' })
      expect(within(seasonal).getByRole('button', { name: 'Leeks' })).toBeInTheDocument()
      expect(within(seasonal).queryByRole('button', { name: 'Asparagus' })).not.toBeInTheDocument()

      const others = within(picker).getByRole('region', { name: 'Everything else' })
      const names = within(others)
        .getAllByRole('button')
        .map((chip) => chip.textContent ?? '')
      expect(names).toContain('Asparagus')
      expect(names).toContain('Oca')
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en-GB')))

      // Only growable things are offered.
      expect(within(picker).queryByRole('button', { name: 'Feta' })).not.toBeInTheDocument()
    })

    it('filters both groups by name', async () => {
      const { user } = renderWithApp(<PatchScreen />)
      const picker = await openPicker(user)
      await user.type(within(picker).getByRole('searchbox', { name: 'Find a crop' }), 'bean')

      const seasonal = within(picker).getByRole('region', { name: 'In season in October' })
      expect(within(seasonal).getAllByRole('button').map((chip) => chip.textContent)).toEqual([
        'French beans',
        'Runner beans',
      ])
      const others = within(picker).getByRole('region', { name: 'Everything else' })
      expect(within(others).getAllByRole('button').map((chip) => chip.textContent)).toEqual(['Broad beans'])
      // Read out once the typing settles.
      await waitFor(() => expect(announced(picker)).toEqual(['3 crops found.']))

      await user.type(within(picker).getByRole('searchbox', { name: 'Find a crop' }), 'zzz')
      expect(within(picker).getByText('Nothing on the list matches that. You can add it yourself below.')).toBeInTheDocument()
      await waitFor(() =>
        expect(announced(picker)).toEqual(['Nothing on the list matches that. You can add it yourself below.']),
      )
    })

    it("adds the person's own crop when it isn't on the list", async () => {
      const { user, saved } = renderWithApp(<PatchScreen />)
      const picker = await openPicker(user)
      await user.click(within(picker).getByRole('radio', { name: 'Coming soon' }))
      await user.type(within(picker).getByRole('textbox', { name: 'Name' }), '  Oca ')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))

      const [mine] = saved()?.myIngredients ?? []
      expect(mine).toEqual({
        id: expect.stringMatching(/^my-oca-[a-z0-9]{5}$/),
        name: 'Oca',
        aisle: 'veg',
        growable: true,
        art: 'seedling',
        harvestMonths: [],
      })
      expect(saved()?.harvest).toEqual([{ ingredientId: mine?.id, status: 'soon', glut: false, addedOn: '2026-10-07' }])
      expect(shown('Added oca to the patch.', picker)).toBeInTheDocument()
      expect(announced(picker)).toEqual(['Added oca to the patch.'])
      expect(within(picker).getByRole('button', { name: 'Oca' })).toHaveAttribute('aria-pressed', 'true')
      expect(within(picker).getByRole('textbox', { name: 'Name' })).toHaveValue('')
    })

    it('asks for a name, and uses the existing crop rather than making a twin', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />)
      const picker = await openPicker(user)
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))
      const name = within(picker).getByRole('textbox', { name: 'Name' })
      expect(name).toHaveAccessibleDescription('Give it a name.')
      expect(name).toHaveFocus()

      await user.type(name, 'kale')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))
      expect(saved()?.myIngredients).toEqual([])
      expect(saved()?.harvest.map((item) => item.ingredientId)).toEqual(['kale'])
      expect(shown('Added kale to the patch.', picker)).toBeInTheDocument()
    })

    it('puts something on the list that is not usually grown on the patch as it is, without a twin', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />)
      const picker = await openPicker(user)
      await user.type(within(picker).getByRole('textbox', { name: 'Name' }), ' MUSHROOMS ')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))

      expect(saved()?.myIngredients).toEqual([])
      expect(saved()?.harvest).toEqual([{ ingredientId: 'mushrooms', status: 'ready', glut: false, addedOn: '2026-10-07' }])
      expect(shown('Added mushrooms to the patch.', picker)).toBeInTheDocument()
      await user.click(within(picker).getByRole('button', { name: 'Done' }))
      // No drawing of its own, so the seedling stands in.
      expect(screen.getByRole('button', { name: 'Mushrooms, ready now' })).toBeInTheDocument()
    })

    it("matches the person's own crops too, whatever the case or accents", async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { myIngredients: [oca] } })
      const picker = await openPicker(user)
      await user.type(within(picker).getByRole('textbox', { name: 'Name' }), 'ÓCA')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))
      expect(saved()?.myIngredients).toEqual([oca])
      expect(saved()?.harvest.map((item) => item.ingredientId)).toEqual([oca.id])
    })

    it('keeps the glut of a crop already on the patch when it is added again by name', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />, { state: { harvest: [crop('kale', 'soon', true)] } })
      const picker = await openPicker(user)
      await user.type(within(picker).getByRole('textbox', { name: 'Name' }), 'Kale')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))
      expect(saved()?.harvest).toEqual([crop('kale', 'ready', true)])
    })

    it('says salt and water need no adding', async () => {
      const { user, saved } = renderWithApp(<PatchScreen />)
      const picker = await openPicker(user)
      await user.type(within(picker).getByRole('textbox', { name: 'Name' }), 'salt')
      await user.click(within(picker).getByRole('button', { name: 'Add to the patch' }))
      expect(within(picker).getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription(
        'No need, salt is always counted as in the larder.',
      )
      expect(saved()?.harvest).toEqual([])
    })
  })
})
