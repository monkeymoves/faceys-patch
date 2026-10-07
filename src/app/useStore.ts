import { createContext, use } from 'react'
import type { Action, AppState, Catalogue, LoadNotice } from '../domain'

/** Something the person needs to know about their saved data. */
export type StorageProblem = LoadNotice | 'save-quota' | 'save-failed'

export interface Store {
  state: AppState
  dispatch: (action: Action) => void
  /** Built-in recipes and ingredients plus the person's own. */
  catalogue: Catalogue
  problem: StorageProblem | undefined
  dismissProblem: () => void
  /** After unreadable data was set aside on load: reads that kept copy, for downloading. */
  readCorruptCopy: (() => string | null) | undefined
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const store = use(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
