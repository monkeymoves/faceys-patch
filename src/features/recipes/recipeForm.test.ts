import { describe, expect, it } from 'vitest'
import { CATALOGUE } from '../../data'
import { buildCatalogue, LIMITS, makeMyId, myRecipeSchema, type Ingredient, type Recipe } from '../../domain'
import { checkDraft, draftFromRecipe, emptyDraft, methodSteps, searchIngredients } from './recipeForm'

const INGREDIENTS: Ingredient[] = [
  { id: 'courgette', name: 'Courgettes', aisle: 'veg', growable: true, art: 'courgette', harvestMonths: [7] },
  { id: 'red-cabbage', name: 'Red cabbage', aisle: 'veg', growable: true, art: 'cabbage', harvestMonths: [10] },
  { id: 'cabbage', name: 'Cabbage', aisle: 'veg', growable: true, art: 'cabbage', harvestMonths: [10] },
  { id: 'gruyere', name: 'Gruyère', aisle: 'dairy-eggs', growable: false },
  { id: 'bacon', name: 'Bacon', aisle: 'meat-fish', growable: false },
]
const catalogue = buildCatalogue(INGREDIENTS, [])

describe('methodSteps', () => {
  it('makes one step per line, trimmed, without blank lines', () => {
    expect(methodSteps('  Chop.\n\n   \nCook. \n')).toEqual(['Chop.', 'Cook.'])
  })
})

describe('checkDraft', () => {
  it('names each thing that is missing', () => {
    const result = checkDraft({ ...emptyDraft(), title: '   ' }, 'my-x-00000', catalogue)
    expect(result).toEqual({
      ok: false,
      errors: {
        title: 'Give it a name.',
        ingredients: 'Add at least one ingredient.',
        method: 'Add at least one step.',
      },
    })
  })

  it('catches too many steps and over-long ones', () => {
    const rows = [{ id: 'courgette', amount: '2', optional: false }]
    const many = Array.from({ length: LIMITS.steps + 1 }, (_, index) => `Step ${index}`).join('\n')
    expect(checkDraft({ ...emptyDraft(), title: 'A', rows, method: many }, 'my-a-00000', catalogue)).toMatchObject({
      ok: false,
      errors: { method: `Keep it to ${LIMITS.steps} steps or fewer.` },
    })
    const long = 'x'.repeat(LIMITS.stepLength + 1)
    expect(checkDraft({ ...emptyDraft(), title: 'A', rows, method: long }, 'my-a-00000', catalogue)).toMatchObject({
      ok: false,
      errors: { method: expect.stringContaining('Try splitting') },
    })
  })

  it('marks just the ingredient whose amount is too long, in plain words', () => {
    const rows = [
      { id: 'courgette', amount: '2', optional: false },
      { id: 'bacon', amount: 'x'.repeat(LIMITS.amountLength + 1), optional: false },
    ]
    const result = checkDraft({ ...emptyDraft(), title: 'A', rows, method: 'Cook.' }, 'my-a-00000', catalogue)
    expect(result).toEqual({
      ok: false,
      errors: { rows: { bacon: `Keep the amount to ${LIMITS.amountLength} characters or fewer.` } },
    })
  })

  it('marks the ingredient whose kept prep is too long for the saved state', () => {
    const rows = [{ id: 'bacon', amount: '4', optional: false, prep: 'y'.repeat(LIMITS.prepLength + 1) }]
    const result = checkDraft({ ...emptyDraft(), title: 'A', rows, method: 'Cook.' }, 'my-a-00000', catalogue)
    expect(result).toMatchObject({ ok: false, errors: { rows: { bacon: expect.stringContaining('shortening') } } })
  })

  it('builds a recipe that passes the saved-state schema, with the diet worked out', () => {
    const result = checkDraft(
      {
        title: '  Bacon and cabbage ',
        note: ' Proper comfort. ',
        minutes: 25,
        serves: 2,
        course: 'main',
        rows: [
          { id: 'cabbage', amount: ' half ', optional: false, prep: 'shredded' },
          { id: 'bacon', amount: '4 rashers', optional: true },
        ],
        method: 'Fry the bacon.\nAdd the cabbage.',
      },
      'my-bacon-and-cabbage-abcde',
      catalogue,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.recipe).toEqual({
      id: 'my-bacon-and-cabbage-abcde',
      title: 'Bacon and cabbage',
      blurb: 'Proper comfort.',
      minutes: 25,
      serves: 2,
      course: 'main',
      diet: [],
      ingredients: [
        { id: 'cabbage', amount: 'half', prep: 'shredded' },
        { id: 'bacon', amount: '4 rashers', optional: true },
      ],
      steps: ['Fry the bacon.', 'Add the cabbage.'],
    })
    expect(myRecipeSchema.safeParse(result.recipe).success).toBe(true)
  })
})

describe('draftFromRecipe', () => {
  const recipe: Recipe = {
    id: 'slaw',
    title: 'Red cabbage slaw',
    blurb: 'Crunchy.',
    minutes: 15,
    serves: 4,
    course: 'salad',
    diet: ['vegan', 'vegetarian'],
    ingredients: [{ id: 'red-cabbage', amount: '1/2', prep: 'shredded' }],
    steps: ['Shred.', 'Dress.'],
  }

  it('fills the form, marking a copy as your version and folding the prep into the amount', () => {
    expect(draftFromRecipe(recipe, true)).toEqual({
      title: 'Red cabbage slaw (my version)',
      note: 'Crunchy.',
      minutes: 15,
      serves: 4,
      course: 'salad',
      rows: [{ id: 'red-cabbage', amount: '1/2, shredded', optional: false }],
      method: 'Shred.\nDress.',
    })
    expect(draftFromRecipe(recipe, false).title).toBe('Red cabbage slaw')
  })

  it('keeps the prep apart when amount and prep together would be too long to save', () => {
    const amount = 'a'.repeat(LIMITS.amountLength - 5)
    const long = { ...recipe, ingredients: [{ id: 'red-cabbage', amount, prep: 'finely shredded' }] }
    expect(draftFromRecipe(long, true).rows).toEqual([
      { id: 'red-cabbage', amount, optional: false, prep: 'finely shredded' },
    ])
  })

  it('can copy and save every built-in recipe as it stands', () => {
    const problems = CATALOGUE.recipes.flatMap((builtIn) => {
      const result = checkDraft(draftFromRecipe(builtIn, true), makeMyId(builtIn.title), CATALOGUE)
      return result.ok ? [] : [{ id: builtIn.id, errors: result.errors }]
    })
    expect(problems).toEqual([])
  })
})

describe('searchIngredients', () => {
  it('finds by any part of the name, starts-with first, ignoring accents and what is chosen', () => {
    expect(searchIngredients(catalogue, 'cab', new Set()).map((i) => i.id)).toEqual(['cabbage', 'red-cabbage'])
    expect(searchIngredients(catalogue, 'gruyere', new Set()).map((i) => i.id)).toEqual(['gruyere'])
    expect(searchIngredients(catalogue, 'cab', new Set(['cabbage'])).map((i) => i.id)).toEqual(['red-cabbage'])
    expect(searchIngredients(catalogue, '  ', new Set())).toEqual([])
  })
})

