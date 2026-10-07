import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CATALOGUE } from '../data'
import {
  loadState,
  reducer,
  saveState,
  withMyContent,
  type Action,
  type Catalogue,
  type KeyValueStorage,
} from '../domain'
import { browserStorage } from './browserStorage'
import { StoreContext, type StorageProblem } from './useStore'

interface StoreProviderProps {
  children: ReactNode
  storage?: KeyValueStorage
  builtIn?: Catalogue
}

export function StoreProvider({ children, storage = browserStorage, builtIn = CATALOGUE }: StoreProviderProps) {
  const [loaded] = useState(() => loadState(storage))
  const [state, setState] = useState(loaded.state)
  const [problem, setProblem] = useState<StorageProblem | undefined>(loaded.notice)
  // The latest state, so several dispatches in one event each build on the last.
  const latest = useRef(loaded.state)

  // If storage couldn't be read (or a corrupt copy couldn't be kept), writing
  // would risk overwriting data we never managed to read. Stay read-only.
  const canSave = loaded.notice !== 'storage-unavailable'

  const dispatch = useCallback(
    (action: Action) => {
      const next = reducer(latest.current, action)
      if (next === latest.current) return
      latest.current = next
      setState(next)
      if (!canSave) {
        // Say so again on every change: nothing is being kept, and that must never be silent.
        setProblem('storage-unavailable')
        return
      }

      const result = saveState(storage, next)
      if (result.ok) {
        setProblem((current) => (current === 'save-quota' || current === 'save-failed' ? undefined : current))
      } else {
        setProblem(result.reason === 'quota' ? 'save-quota' : 'save-failed')
      }
    },
    [canSave, storage],
  )

  // Only the person's own recipes and ingredients change the catalogue, so a
  // tick on the shopping list doesn't rebuild it and re-run matching.
  const { myRecipes, myIngredients } = state
  const catalogue = useMemo(
    () => withMyContent(builtIn, { myRecipes, myIngredients }),
    [builtIn, myRecipes, myIngredients],
  )
  const dismissProblem = useCallback(() => setProblem(undefined), [])

  const store = useMemo(
    () => ({ state, dispatch, catalogue, problem, dismissProblem }),
    [state, dispatch, catalogue, problem, dismissProblem],
  )
  return <StoreContext value={store}>{children}</StoreContext>
}
