import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LIMITS, type AppState, type HarvestItem, type Recipe } from '../../domain'
import { renderWithApp } from '../../test/render'
import { CookScreen } from '../cook/CookScreen'

const ready = (ingredientId: string): HarvestItem => ({
  ingredientId,
  status: 'ready',
  glut: false,
  addedOn: '2026-10-01',
})

const fritters: Recipe = {
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

function renderCook(state: Partial<AppState> = {}) {
  return renderWithApp(<CookScreen />, {
    state: {
      harvest: [ready('courgette'), ready('tomato')],
      larder: ['onion', 'garlic', 'olive-oil', 'butter'],
      ...state,
    },
  })
}

const dialog = (name: string) => screen.getByRole('dialog', { name })

describe('Recipe view', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12)) // Wednesday 7 October 2026
  })

  afterEach(() => {
    vi.useRealTimers()
    window.location.hash = ''
  })

  it('splits ingredients into from the patch, in the larder and to buy, then the method', async () => {
    const { user } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    const view = within(dialog('Ratatouille'))

    const patch = within(view.getByRole('region', { name: 'From the patch' }))
    expect(patch.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Courgettes'),
      expect.stringContaining('Tomatoes'),
    ])
    const larder = within(view.getByRole('region', { name: 'In the larder' }))
    expect(larder.getByText('Onions')).toBeInTheDocument()
    expect(larder.getByText('Olive oil')).toBeInTheDocument()
    const buy = within(view.getByRole('region', { name: 'To buy' }))
    expect(buy.getByText('Aubergines')).toBeInTheDocument()
    expect(buy.getByText('Thyme').parentElement).toHaveTextContent('Thyme optional')

    expect(view.getByText('1 large, cut into 2cm chunks')).toBeInTheDocument()
    expect(view.getByText('Vegan')).toBeInTheDocument()
    const steps = within(view.getByRole('region', { name: 'Method' })).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    // The numbers are read out, not hidden.
    expect(steps[0]).toHaveTextContent(/^Step 1/)
    expect(view.getByRole('button', { name: 'Make my own version' })).toBeInTheDocument()
  })

  it('works for a recipe of yours that uses nothing from the patch', async () => {
    const { user } = renderCook({ myRecipes: [flapjacks] })
    await user.click(screen.getByRole('radio', { name: 'Mine' }))
    await user.click(screen.getByRole('button', { name: "Dad's flapjacks" }))
    const view = within(dialog("Dad's flapjacks"))

    expect(view.queryByRole('region', { name: 'From the patch' })).not.toBeInTheDocument()
    expect(within(view.getByRole('region', { name: 'In the larder' })).getByText('Butter')).toBeInTheDocument()
    expect(within(view.getByRole('region', { name: 'To buy' })).getByText('Porridge oats')).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('adds it to a day from the day picker and says so', async () => {
    const { user, saved } = renderCook({
      plan: { '2026-10-09': [{ id: 'meal-1', recipeId: 'lemony-courgette-spaghetti', cooked: false }] },
    })
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    await user.click(within(dialog('Ratatouille')).getByRole('button', { name: 'Add to a day' }))

    const picker = within(dialog('Which day?'))
    const thisWeek = within(picker.getByRole('region', { name: 'This week' }))
    expect(thisWeek.getAllByRole('button')).toHaveLength(5)
    expect(thisWeek.getByRole('button', { name: 'Wednesday 7 October, today' })).toBeInTheDocument()
    expect(thisWeek.getByRole('button', { name: 'Friday 9 October' })).toHaveAccessibleDescription(
      'Lemony courgette spaghetti',
    )
    expect(within(picker.getByRole('region', { name: 'Next week' })).getAllByRole('button')).toHaveLength(7)
    expect(within(picker.getByRole('region', { name: 'The week after' })).getAllByRole('button')).toHaveLength(2)

    await user.click(thisWeek.getByRole('button', { name: 'Thursday 8 October' }))

    expect(screen.queryByRole('dialog', { name: 'Which day?' })).not.toBeInTheDocument()
    expect(within(dialog('Ratatouille')).getByRole('status')).toHaveTextContent('Added to Thursday 8 October.')
    expect(saved()?.plan['2026-10-08']).toEqual([
      { id: expect.stringMatching(/^meal-/), recipeId: 'ratatouille', cooked: false },
    ])
  })

  it('says which days already have it, while still letting you add it again', async () => {
    const { user, saved } = renderCook({
      plan: { '2026-10-09': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: false }] },
    })
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    await user.click(within(dialog('Ratatouille')).getByRole('button', { name: 'Add to a day' }))

    const picker = within(dialog('Which day?'))
    const friday = picker.getByRole('button', { name: 'Friday 9 October' })
    expect(friday).toHaveAccessibleDescription('Already planned Ratatouille')
    expect(picker.getAllByText('Already planned')).toHaveLength(1)
    expect(picker.getByRole('button', { name: 'Thursday 8 October' })).toHaveAccessibleDescription(
      'Nothing planned yet',
    )

    await user.click(friday)
    expect(saved()?.plan['2026-10-09']).toHaveLength(2)
  })
})

describe('Writing a recipe', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('saves a new recipe, shows it, and lists it under Mine and in the matches', async () => {
    const { user, saved } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Write a recipe' }))
    const form = within(dialog('Write a recipe'))

    await user.type(form.getByRole('textbox', { name: 'Title' }), "Nan's courgette fritters")
    await user.type(form.getByRole('searchbox', { name: 'Add an ingredient' }), 'courg')
    await user.click(form.getByRole('button', { name: 'Add Courgettes' }))
    const amount = form.getByRole('textbox', { name: 'Amount of Courgettes' })
    expect(amount).toHaveFocus()
    await user.type(amount, '2 big ones')
    await user.type(form.getByRole('searchbox', { name: 'Add an ingredient' }), 'eggs{Enter}')
    expect(form.getByRole('group', { name: 'Eggs' })).toBeInTheDocument()
    await user.type(
      form.getByRole('textbox', { name: 'Method' }),
      'Grate the courgettes.{Enter}{Enter}  Fry spoonfuls.  ',
    )
    await user.click(form.getByRole('button', { name: 'Save recipe' }))

    expect(screen.queryByRole('dialog', { name: 'Write a recipe' })).not.toBeInTheDocument()
    expect(dialog("Nan's courgette fritters")).toBeInTheDocument()
    const [recipe] = saved()?.myRecipes ?? []
    expect(recipe).toMatchObject({
      id: expect.stringMatching(/^my-nans-courgette-fritters-/),
      title: "Nan's courgette fritters",
      course: 'main',
      diet: ['vegetarian'],
      ingredients: [
        { id: 'courgette', amount: '2 big ones' },
        { id: 'egg', amount: '' },
      ],
      steps: ['Grate the courgettes.', 'Fry spoonfuls.'],
    })

    await user.click(within(dialog("Nan's courgette fritters")).getByRole('button', { name: 'Close' }))
    expect(
      within(screen.getByRole('region', { name: 'Meals' })).getByRole('button', { name: "Nan's courgette fritters" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Mine' }))
    expect(screen.getByRole('button', { name: "Nan's courgette fritters" })).toBeInTheDocument()
  })

  it('explains what is missing in plain words and keeps everything typed', async () => {
    const { user, saved } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Write a recipe' }))
    const form = within(dialog('Write a recipe'))
    await user.type(form.getByRole('textbox', { name: /Short note/ }), 'Lovely with cheese.')
    await user.type(form.getByRole('textbox', { name: 'Method' }), '{Enter}   {Enter}')
    await user.click(form.getByRole('button', { name: 'Save recipe' }))

    expect(form.getByRole('textbox', { name: 'Title' })).toHaveAccessibleDescription('Give it a name.')
    expect(form.getByRole('textbox', { name: 'Title' })).toHaveFocus()
    expect(form.getByText('Add at least one ingredient.')).toBeInTheDocument()
    // Said with the search box, where it's fixed, not only on the group round it.
    expect(form.getByRole('searchbox', { name: 'Add an ingredient' })).toHaveAccessibleDescription(
      'Add at least one ingredient.',
    )
    expect(form.getByRole('textbox', { name: 'Method' })).toHaveAccessibleDescription(/Add at least one step\./)
    expect(form.getByRole('textbox', { name: /Short note/ })).toHaveValue('Lovely with cheese.')
    expect(saved()?.myRecipes).toEqual([])

    await user.type(form.getByRole('textbox', { name: 'Title' }), 'Cheese on toast')
    expect(form.getByRole('textbox', { name: 'Title' })).not.toHaveAccessibleDescription('Give it a name.')
  })

  it('asks before throwing away a half-written recipe, however it is closed', async () => {
    const { user } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Write a recipe' }))
    const form = within(dialog('Write a recipe'))
    await user.type(form.getByRole('textbox', { name: 'Title' }), 'Soup')

    for (const close of [
      () => user.keyboard('{Escape}'),
      () => user.click(form.getByRole('button', { name: 'Cancel' })),
      () => user.click(form.getByRole('button', { name: 'Close' })),
      () => user.click(dialog('Write a recipe')),
    ]) {
      await close()
      const confirm = screen.getByRole('alertdialog', { name: 'Throw this recipe away?' })
      expect(within(confirm).getByRole('button', { name: 'Keep writing' })).toHaveFocus()
      await user.click(within(confirm).getByRole('button', { name: 'Keep writing' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(form.getByRole('textbox', { name: 'Title' })).toHaveValue('Soup')
    }

    // The system back gesture can close the dialog outright; it opens again and asks.
    act(() => (dialog('Write a recipe') as HTMLDialogElement).close())
    expect(dialog('Write a recipe')).toHaveAttribute('open')
    expect(screen.getByRole('alertdialog', { name: 'Throw this recipe away?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Throw it away' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write a recipe' })).toHaveFocus()
  })

  it('closes straight away when nothing has changed', async () => {
    const { user } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    await user.click(within(dialog('Ratatouille')).getByRole('button', { name: 'Make my own version' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Make it your own' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(dialog('Ratatouille')).toBeInTheDocument()
  })

  it('makes a new ingredient inside the form when it is not on the list', async () => {
    const { user, saved } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Write a recipe' }))
    const form = within(dialog('Write a recipe'))
    await user.type(form.getByRole('textbox', { name: 'Title' }), 'Kohlrabi slaw')
    await user.type(form.getByRole('searchbox', { name: 'Add an ingredient' }), 'kohlrabi')
    expect(form.getByText('Nothing called “kohlrabi” on the list.')).toBeInTheDocument()

    await user.click(form.getByRole('button', { name: 'Not on the list?' }))
    expect(form.getByRole('textbox', { name: 'Ingredient name' })).toHaveValue('Kohlrabi')
    await user.click(form.getByRole('checkbox', { name: 'I grow this' }))
    await user.click(form.getByRole('button', { name: 'Add it' }))

    expect(form.getByRole('group', { name: 'Kohlrabi' })).toBeInTheDocument()
    const [kohlrabi] = saved()?.myIngredients ?? []
    expect(kohlrabi).toEqual({
      id: expect.stringMatching(/^my-kohlrabi-/),
      name: 'Kohlrabi',
      aisle: 'veg',
      growable: true,
      art: 'seedling',
      harvestMonths: [],
    })

    await user.type(form.getByRole('textbox', { name: 'Method' }), 'Grate and dress.')
    await user.click(form.getByRole('button', { name: 'Save recipe' }))
    expect(saved()?.myRecipes[0]?.ingredients).toEqual([{ id: kohlrabi?.id, amount: '' }])
  })

  it('edits one of your recipes in place', async () => {
    const { user, saved } = renderCook({ myRecipes: [fritters] })
    await user.click(screen.getByRole('radio', { name: 'Mine' }))
    await user.click(screen.getByRole('button', { name: "Nan's courgette fritters" }))
    await user.click(within(dialog("Nan's courgette fritters")).getByRole('button', { name: 'Edit' }))

    const form = within(dialog('Edit recipe'))
    const title = form.getByRole('textbox', { name: 'Title' })
    expect(title).toHaveValue("Nan's courgette fritters")
    expect(form.getByRole('textbox', { name: 'Method' })).toHaveValue(
      'Grate the courgettes.\nFry spoonfuls in hot oil.',
    )
    await user.clear(title)
    await user.type(title, "Nan's best fritters")
    await user.click(
      within(form.getByRole('group', { name: 'Courgettes' })).getByRole('checkbox', { name: 'Optional' }),
    )
    await user.click(form.getByRole('button', { name: 'Save recipe' }))

    expect(dialog("Nan's best fritters")).toBeInTheDocument()
    expect(saved()?.myRecipes).toHaveLength(1)
    expect(saved()?.myRecipes[0]).toMatchObject({
      id: fritters.id,
      title: "Nan's best fritters",
      ingredients: [
        { id: 'courgette', amount: '2', optional: true },
        { id: 'egg', amount: '1' },
      ],
    })
  })

  it('makes your own version of a built-in recipe as a new recipe', async () => {
    const { user, saved } = renderCook()
    await user.click(screen.getByRole('button', { name: 'Ratatouille' }))
    await user.click(within(dialog('Ratatouille')).getByRole('button', { name: 'Make my own version' }))

    const form = within(dialog('Make it your own'))
    expect(form.getByRole('textbox', { name: 'Title' })).toHaveValue('Ratatouille (my version)')
    expect(form.getByRole('group', { name: 'Aubergines' })).toBeInTheDocument()
    // The prep has no field of its own, so it joins the amount where you can see and change it.
    const amount = form.getByRole('textbox', { name: 'Amount of Aubergines' })
    expect(amount).toHaveValue('1 large, cut into 2cm chunks')
    expect(amount).toHaveAttribute('maxlength', String(LIMITS.amountLength))
    await user.click(form.getByRole('button', { name: 'Remove Basil' }))
    await user.click(form.getByRole('button', { name: 'Save recipe' }))

    const view = dialog('Ratatouille (my version)')
    expect(view).toBeInTheDocument()
    // The button that opened the form went with the built-in recipe, so focus lands on Edit.
    expect(within(view).getByRole('button', { name: 'Edit' })).toHaveFocus()
    const [copy] = saved()?.myRecipes ?? []
    expect(copy?.id).toMatch(/^my-ratatouille-my-version-/)
    expect(copy?.diet).toEqual(['vegan', 'vegetarian'])
    expect(copy?.ingredients).toContainEqual({ id: 'aubergine', amount: '1 large, cut into 2cm chunks' })
    expect(copy?.ingredients.map((ingredient) => ingredient.id)).not.toContain('basil')
    expect(copy?.steps).toHaveLength(5)
  })

  it('deletes one of yours after a confirm, taking it off the plan too', async () => {
    const { user, saved } = renderCook({
      myRecipes: [fritters],
      plan: {
        '2026-10-08': [{ id: 'meal-1', recipeId: fritters.id, cooked: false }],
        '2026-10-09': [{ id: 'meal-2', recipeId: 'ratatouille', cooked: false }],
      },
    })
    await user.click(screen.getByRole('radio', { name: 'Mine' }))
    await user.click(screen.getByRole('button', { name: "Nan's courgette fritters" }))
    await user.click(within(dialog("Nan's courgette fritters")).getByRole('button', { name: 'Delete' }))

    const confirm = within(screen.getByRole('alertdialog', { name: 'Delete this recipe?' }))
    expect(confirm.getByText(/taken off any days it's planned for/)).toBeInTheDocument()
    await user.click(confirm.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog', { name: 'Delete this recipe?' })).not.toBeInTheDocument()
    expect(saved()?.myRecipes).toEqual([fritters])

    await user.click(within(dialog("Nan's courgette fritters")).getByRole('button', { name: 'Delete' }))
    await user.click(
      within(screen.getByRole('alertdialog', { name: 'Delete this recipe?' })).getByRole('button', {
        name: 'Delete recipe',
      }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(saved()?.myRecipes).toEqual([])
    expect(saved()?.plan).toEqual({ '2026-10-09': [{ id: 'meal-2', recipeId: 'ratatouille', cooked: false }] })
    expect(screen.getByRole('heading', { name: 'No recipes of your own yet' })).toBeInTheDocument()
  })
})
