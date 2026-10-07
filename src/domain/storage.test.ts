import { describe, expect, it } from 'vitest'
import { initialState } from './state'
import {
  MAX_BACKUP_BYTES,
  STORAGE_KEY,
  loadState,
  parseBackup,
  saveState,
  serializeBackup,
  type KeyValueStorage,
} from './storage'
import { makeRecipe, makeState, ready } from './test-fixtures'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: KeyValueStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
  return { data, storage }
}

const failing = (error: unknown): KeyValueStorage => ({
  getItem: () => {
    throw error
  },
  setItem: () => {
    throw error
  },
})

const NOW = new Date(1_791_360_000_000) // a fixed instant, so the corrupt key is predictable
const now = () => NOW

const savedState = makeState({
  harvest: [ready('courgette')],
  larder: ['feta'],
  plan: { '2026-10-05': [{ id: 'meal-1', recipeId: 'shakshuka', cooked: false }] },
  myRecipes: [makeRecipe('my-chutney-a1b2c', 'Chutney', ['courgette'], { course: 'preserve' })],
})

describe('loadState', () => {
  it('starts fresh, with no notice, when nothing is saved yet', () => {
    const { storage } = memoryStorage()
    expect(loadState(storage, now)).toEqual({ state: initialState() })
  })

  it('loads a saved state', () => {
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(savedState) })
    expect(loadState(storage, now)).toEqual({ state: savedState })
  })

  it('loads state saved before my recipes and ingredients existed', () => {
    const { myRecipes: _r, myIngredients: _i, ...older } = savedState
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(older) })
    expect(loadState(storage, now).state).toEqual({ ...older, myRecipes: [], myIngredients: [] })
  })

  it.each([
    ['not JSON', '{"version": 1, "harvest": ['],
    ['JSON that fails the schema', JSON.stringify({ ...savedState, larder: 'feta' })],
  ])('keeps a copy of saved data that is %s, then starts fresh with a notice', (_label, raw) => {
    const { data, storage } = memoryStorage({ [STORAGE_KEY]: raw })
    const copyKey = `${STORAGE_KEY}.corrupt.${NOW.getTime()}`
    expect(loadState(storage, now)).toEqual({
      state: initialState(),
      notice: 'recovered-corrupt',
      corruptCopyKey: copyKey,
    })
    expect(data.get(copyKey)).toBe(raw)
  })

  it('starts afresh for real after keeping a copy, so reloading does not pile up more copies', () => {
    const { data, storage } = memoryStorage({ [STORAGE_KEY]: 'not json' })
    loadState(storage, now)
    expect(JSON.parse(data.get(STORAGE_KEY) ?? '')).toEqual(initialState())

    expect(loadState(storage, () => new Date(NOW.getTime() + 1000))).toEqual({ state: initialState() })
    expect([...data.keys()].filter((key) => key.includes('.corrupt.'))).toHaveLength(1)
  })

  it('still reports the kept copy when the fresh start cannot be written', () => {
    const data = new Map([[STORAGE_KEY, 'not json']])
    const storage: KeyValueStorage = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        if (key === STORAGE_KEY) throw new DOMException('Full', 'QuotaExceededError')
        data.set(key, value)
      },
    }
    expect(loadState(storage, now)).toMatchObject({ notice: 'recovered-corrupt' })
    expect(data.get(`${STORAGE_KEY}.corrupt.${NOW.getTime()}`)).toBe('not json')
  })

  it('starts fresh with a notice when storage cannot be read at all', () => {
    expect(loadState(failing(new DOMException('Blocked', 'SecurityError')), now)).toEqual({
      state: initialState(),
      notice: 'storage-unavailable',
    })
  })

  it('reports storage as unavailable when a corrupt copy cannot be kept, rather than claim it was saved', () => {
    const raw = 'not json'
    const storage: KeyValueStorage = {
      getItem: () => raw,
      setItem: () => {
        throw new DOMException('Full', 'QuotaExceededError')
      },
    }
    expect(loadState(storage, now)).toEqual({ state: initialState(), notice: 'storage-unavailable' })
  })

  it('uses the current time for the corrupt copy by default', () => {
    const { data, storage } = memoryStorage({ [STORAGE_KEY]: 'not json' })
    loadState(storage)
    expect([...data.keys()].some((key) => /^faceys-patch\.v1\.corrupt\.\d+$/.test(key))).toBe(true)
  })
})

describe('saveState', () => {
  it('saves under the faceys-patch.v1 key so that loadState gets it back', () => {
    const { data, storage } = memoryStorage()
    expect(saveState(storage, savedState)).toEqual({ ok: true })
    expect(STORAGE_KEY).toBe('faceys-patch.v1')
    expect(data.has(STORAGE_KEY)).toBe(true)
    expect(loadState(storage, now)).toEqual({ state: savedState })
  })

  it.each([
    ['QuotaExceededError', new DOMException('Full', 'QuotaExceededError')],
    ['the old Firefox quota error', new DOMException('Full', 'NS_ERROR_DOM_QUOTA_REACHED')],
  ])('reports a full store (%s) as quota', (_label, error) => {
    expect(saveState(failing(error), savedState)).toEqual({ ok: false, reason: 'quota' })
  })

  it.each([
    ['a security error', new DOMException('Blocked', 'SecurityError')],
    ['anything else', new Error('Nope')],
    ['a thrown string', 'nope'],
  ])('reports %s as unavailable', (_label, error) => {
    expect(saveState(failing(error), savedState)).toEqual({ ok: false, reason: 'unavailable' })
  })
})

describe('serializeBackup', () => {
  it('writes compact JSON with the app name, the export time and the state', () => {
    const text = serializeBackup(savedState, NOW)
    expect(JSON.parse(text)).toEqual({ app: 'faceys-patch', exportedAt: NOW.toISOString(), state: savedState })
    expect(text).not.toContain('\n')
  })
})

describe('parseBackup', () => {
  it('reads back a backup it wrote', () => {
    expect(parseBackup(serializeBackup(savedState, NOW))).toEqual({ ok: true, state: savedState })
  })

  it('reads a backup made before my recipes and ingredients existed, and drops unknown keys', () => {
    const { myRecipes: _r, myIngredients: _i, ...older } = savedState
    const text = JSON.stringify({ app: 'faceys-patch', exportedAt: 'whenever', state: { ...older, colour: 'green' } })
    expect(parseBackup(text)).toEqual({ ok: true, state: { ...older, myRecipes: [], myIngredients: [] } })
  })

  it('accepts a file of exactly 10 MB, more than localStorage can ever hold', () => {
    const text = serializeBackup(savedState, NOW)
    expect(MAX_BACKUP_BYTES).toBe(10_000_000)
    expect(parseBackup(text.padEnd(MAX_BACKUP_BYTES, ' ')).ok).toBe(true)
  })

  it('rejects a file over 10 MB before trying to read it', () => {
    const text = serializeBackup(savedState, NOW).padEnd(MAX_BACKUP_BYTES + 1, ' ')
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'too-big', error: expect.any(String) })
  })

  it('measures size in bytes, not characters', () => {
    const text = `"${'é'.repeat(MAX_BACKUP_BYTES / 2)}"` // under a million characters, over a million bytes
    expect(text.length).toBeLessThan(MAX_BACKUP_BYTES)
    expect(parseBackup(text)).toMatchObject({ ok: false, reason: 'too-big' })
  })

  it('rejects a file that is not JSON', () => {
    expect(parseBackup('Courgettes, tomatoes, basil')).toMatchObject({ ok: false, reason: 'not-json' })
    expect(parseBackup('')).toMatchObject({ ok: false, reason: 'not-json' })
  })

  it.each([
    ['some other JSON', '{"name":"shopping"}'],
    ['another app', JSON.stringify({ app: 'other-app', state: savedState })],
    ['a bare state with no wrapper', JSON.stringify(savedState)],
    ['a list', '[]'],
    ['null', 'null'],
    ['a number', '42'],
  ])('rejects %s as not a backup', (_label, text) => {
    expect(parseBackup(text)).toMatchObject({ ok: false, reason: 'not-backup' })
  })

  it('rejects a backup whose contents are damaged', () => {
    const text = JSON.stringify({ app: 'faceys-patch', state: { ...savedState, plan: { someday: [] } } })
    expect(parseBackup(text)).toMatchObject({ ok: false, reason: 'invalid' })
    expect(parseBackup(JSON.stringify({ app: 'faceys-patch' }))).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('explains each problem in a short, friendly sentence', () => {
    const errors = [
      parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1)),
      parseBackup('nope'),
      parseBackup('{}'),
      parseBackup('{"app":"faceys-patch","state":{}}'),
    ].map((result) => (result.ok ? '' : result.error))
    expect(errors).toEqual([
      "That file is too big to be a Facey's Patch backup.",
      "That file can't be read. Choose a backup saved from Facey's Patch.",
      "That file isn't a Facey's Patch backup.",
      "That backup is damaged, so it can't be loaded. Nothing has been changed.",
    ])
  })
})
