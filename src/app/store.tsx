import { createContext, use, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { CATALOGUE } from '../data'
import {
  loadState,
  reducer,
  saveState,
  withMyContent,
  type Action,
  type AppState,
  type Catalogue,
  type KeyValueStorage,
  type LoadNotice,
} from '../domain'

/**
 * localStorage, touched lazily: in some Safari modes even reading
 * `window.localStorage` throws, and this way that throw lands inside the
 * domain's try/catch rather than crashing the app.
 */
export const browserStorage: KeyValueStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}

/** Something the person needs to know about their saved data. */
export type StorageProblem = LoadNotice | 'save-quota' | 'save-failed'

interface Store {
  state: AppState
  dispatch: (action: Action) => void
  /** Built-in recipes and ingredients plus the person's own. */
  catalogue: Catalogue
  problem: StorageProblem | undefined
  dismissProblem: () => void
}

const StoreContext = createContext<Store | null>(null)

interface StoreProviderProps {
  children: ReactNode
  storage?: KeyValueStorage
  builtIn?: Catalogue
}

export function StoreProvider({ children, storage = browserStorage, builtIn = CATALOGUE }: StoreProviderProps) {
  const [loaded] = useState(() => loadState(storage))
  const [state, dispatch] = useReducer(reducer, loaded.state)
  const [problem, setProblem] = useState<StorageProblem | undefined>(loaded.notice)

  // If storage couldn't be read (or a corrupt copy couldn't be kept), writing
  // would risk overwriting data we never managed to read. Stay read-only.
  const canSave = loaded.notice !== 'storage-unavailable'
  const lastSaved = useRef(loaded.state)

  useEffect(() => {
    if (!canSave || state === lastSaved.current) return
    const result = saveState(storage, state)
    if (result.ok) {
      lastSaved.current = state
      setProblem((current) => (current === 'save-quota' || current === 'save-failed' ? undefined : current))
    } else {
      setProblem(result.reason === 'quota' ? 'save-quota' : 'save-failed')
    }
  }, [canSave, state, storage])

  const catalogue = useMemo(() => withMyContent(builtIn, state), [builtIn, state])
  const dismissProblem = useCallback(() => setProblem(undefined), [])

  const store = useMemo(
    () => ({ state, dispatch, catalogue, problem, dismissProblem }),
    [state, catalogue, problem, dismissProblem],
  )
  return <StoreContext value={store}>{children}</StoreContext>
}

export function useStore(): Store {
  const store = use(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
