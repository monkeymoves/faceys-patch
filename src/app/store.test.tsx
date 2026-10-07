import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { initialState, STORAGE_KEY, type AppState, type KeyValueStorage } from '../domain'
import { makeMealId } from './ids'
import { StoreProvider } from './store'
import { useStore } from './useStore'

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}

function renderStore(storage: KeyValueStorage) {
  const wrapper = ({ children }: { children: ReactNode }) => <StoreProvider storage={storage}>{children}</StoreProvider>
  return renderHook(() => useStore(), { wrapper })
}

const addCourgettes = { type: 'harvest/add', ingredientId: 'courgette', status: 'ready', glut: true, today: '2026-10-07' } as const

describe('StoreProvider', () => {
  it('starts empty and saves changes so they survive a reload', () => {
    const storage = memoryStorage()
    const first = renderStore(storage)
    expect(first.result.current.state).toEqual(initialState())

    act(() => first.result.current.dispatch(addCourgettes))
    first.unmount()

    const second = renderStore(storage)
    expect(second.result.current.state.harvest).toEqual([
      { ingredientId: 'courgette', status: 'ready', glut: true, addedOn: '2026-10-07' },
    ])
    expect(second.result.current.problem).toBeUndefined()
  })

  it('does not write anything until something changes', () => {
    const storage = memoryStorage()
    renderStore(storage)
    expect(storage.data.size).toBe(0)
  })

  it('reports corrupt saved data, keeps a copy, and starts afresh', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{not json' })
    const { result } = renderStore(storage)

    expect(result.current.problem).toBe('recovered-corrupt')
    expect(result.current.state).toEqual(initialState())
    expect([...storage.data.values()]).toContain('{not json')
  })

  it('never writes when storage could not be read, so unread data is not overwritten', () => {
    const writes: string[] = []
    const storage: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: (key) => void writes.push(key),
    }
    const { result } = renderStore(storage)
    expect(result.current.problem).toBe('storage-unavailable')

    act(() => result.current.dispatch(addCourgettes))
    expect(result.current.state.harvest).toHaveLength(1)
    expect(writes).toEqual([])
  })

  it('reminds the person after every change that nothing is being saved, even once dismissed', () => {
    const storage: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => undefined,
    }
    const { result } = renderStore(storage)
    act(() => result.current.dismissProblem())
    expect(result.current.problem).toBeUndefined()

    act(() => result.current.dispatch(addCourgettes))
    expect(result.current.problem).toBe('storage-unavailable')
  })

  it('keeps the same catalogue when only the patch, larder or plan change', () => {
    const { result } = renderStore(memoryStorage())
    const before = result.current.catalogue
    act(() => result.current.dispatch(addCourgettes))
    expect(result.current.catalogue).toBe(before)
  })

  it('reports a full device, and clears the problem once a save works again', () => {
    let full = true
    const backing = memoryStorage()
    const storage: KeyValueStorage = {
      getItem: backing.getItem,
      setItem: (key, value) => {
        if (full) throw new DOMException('full', 'QuotaExceededError')
        backing.setItem(key, value)
      },
    }
    const { result } = renderStore(storage)

    act(() => result.current.dispatch(addCourgettes))
    expect(result.current.problem).toBe('save-quota')

    full = false
    act(() => result.current.dispatch({ type: 'larder/add', ingredientIds: ['olive-oil'] }))
    expect(result.current.problem).toBeUndefined()
    expect(JSON.parse(backing.data.get(STORAGE_KEY) ?? '{}')).toMatchObject({ larder: ['olive-oil'] })
  })

  it("merges the person's own recipes into the catalogue", () => {
    const storage = memoryStorage()
    const { result } = renderStore(storage)
    const builtInCount = result.current.catalogue.recipes.length

    const recipe: AppState['myRecipes'][number] = {
      id: 'my-nans-chutney-abc12',
      title: "Nan's chutney",
      blurb: '',
      minutes: 90,
      serves: 6,
      course: 'preserve',
      diet: ['vegan', 'vegetarian'],
      ingredients: [{ id: 'courgette', amount: '1kg' }],
      steps: ['Chop everything.', 'Simmer until thick.'],
    }
    act(() => result.current.dispatch({ type: 'myRecipes/save', recipe }))

    expect(result.current.catalogue.recipes).toHaveLength(builtInCount + 1)
    expect(result.current.catalogue.recipes).toContainEqual(recipe)
  })

  it('lets the person dismiss a notice', () => {
    const { result } = renderStore(memoryStorage({ [STORAGE_KEY]: 'nope' }))
    act(() => result.current.dismissProblem())
    expect(result.current.problem).toBeUndefined()
  })

  it('throws a helpful error when used outside the provider', () => {
    expect(() => renderHook(() => useStore())).toThrow(/inside <StoreProvider>/)
  })
})

describe('makeMealId', () => {
  it('makes distinct ids', () => {
    expect(makeMealId()).not.toBe(makeMealId())
    expect(makeMealId()).toMatch(/^meal-/)
  })
})

describe('dispatching twice in one event', () => {
  it('applies both changes and saves the result', () => {
    let saved = ''
    const storage: KeyValueStorage = { getItem: () => null, setItem: (_key, value) => void (saved = value) }
    const { result } = renderStore(storage)
    act(() => {
      result.current.dispatch(addCourgettes)
      result.current.dispatch({ type: 'larder/add', ingredientIds: ['olive-oil'] })
    })
    expect(result.current.state.harvest).toHaveLength(1)
    expect(result.current.state.larder).toEqual(['olive-oil'])
    expect(JSON.parse(saved)).toMatchObject({ larder: ['olive-oil'], harvest: [{ ingredientId: 'courgette' }] })
  })
})
