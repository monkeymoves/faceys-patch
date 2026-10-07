import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { NavigationProvider } from '../app/navigation'
import { StoreProvider } from '../app/store'
import { ViewedWeekProvider } from '../app/viewedWeek'
import { initialState, STORAGE_KEY, type AppState, type KeyValueStorage } from '../domain'

/** An in-memory stand-in for localStorage, so tests can read what was saved. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: KeyValueStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
  return {
    storage,
    /** The last saved AppState, or undefined if nothing has been saved. */
    saved: (): AppState | undefined => {
      const raw = data.get(STORAGE_KEY)
      return raw === undefined ? undefined : (JSON.parse(raw) as AppState)
    },
  }
}

export interface RenderAppOptions {
  /** Starting state; merged over an empty state. */
  state?: Partial<AppState>
}

/**
 * Renders a screen inside the real providers, seeded with `state`. Returns the
 * usual Testing Library result plus a userEvent instance and `saved()` to
 * inspect what was persisted.
 */
export function renderWithApp(ui: ReactElement, { state }: RenderAppOptions = {}) {
  const seeded: AppState = { ...initialState(), ...state }
  const memory = memoryStorage({ [STORAGE_KEY]: JSON.stringify(seeded) })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider storage={memory.storage}>
      <NavigationProvider>
        <ViewedWeekProvider>{children}</ViewedWeekProvider>
      </NavigationProvider>
    </StoreProvider>
  )
  const result: RenderResult = render(ui, { wrapper })
  return { ...result, user: userEvent.setup(), saved: memory.saved }
}
