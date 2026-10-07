import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CATALOGUE } from '../data'
import {
  loadState,
  reducer,
  saveState,
  STORAGE_KEY,
  withMyContent,
  type Action,
  type AppState,
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

/**
 * Asks the browser not to clear our storage when space runs low. Best effort:
 * browsers may say no, and there's nothing useful to do about that.
 */
function askToPersist() {
  void navigator.storage?.persist?.().catch(() => false)
}

export function StoreProvider({ children, storage = browserStorage, builtIn = CATALOGUE }: StoreProviderProps) {
  const [loaded] = useState(() => loadState(storage))
  const [state, setState] = useState(loaded.state)
  const [problem, setProblem] = useState<StorageProblem | undefined>(loaded.notice)
  // The latest state, so several dispatches in one event each build on the last.
  const latest = useRef(loaded.state)
  const askedToPersist = useRef(false)

  // If storage couldn't be read (or a corrupt copy couldn't be kept), writing
  // would risk overwriting data we never managed to read. Stay read-only.
  const canSave = loaded.notice !== 'storage-unavailable'

  const save = useCallback(
    (next: AppState) => {
      const result = saveState(storage, next)
      if (result.ok) {
        setProblem((current) => (current === 'save-quota' || current === 'save-failed' ? undefined : current))
        if (!askedToPersist.current) {
          askedToPersist.current = true
          askToPersist()
        }
      } else {
        setProblem(result.reason === 'quota' ? 'save-quota' : 'save-failed')
      }
    },
    [storage],
  )

  const dispatch = useCallback(
    (action: Action) => {
      const next = reducer(latest.current, action)
      if (next === latest.current) return
      latest.current = next
      setState(next)
      if (canSave) {
        save(next)
      } else {
        // Say so again on every change: nothing is being kept, and that must never be silent.
        setProblem('storage-unavailable')
      }
    },
    [canSave, save],
  )

  // Another tab or the installed app changed the saved data: adopt it, so this
  // copy never writes stale data over newer changes. If something else on the
  // same site deleted our data, put back what we hold.
  useEffect(() => {
    if (!canSave) return
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return
      if (event.key === null || event.newValue === null) {
        save(latest.current)
        return
      }
      const fresh = loadState(storage)
      latest.current = fresh.state
      setState(fresh.state)
      if (fresh.notice) setProblem(fresh.notice)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [canSave, save, storage])

  // Only the person's own recipes and ingredients change the catalogue, so a
  // tick on the shopping list doesn't rebuild it and re-run matching.
  const { myRecipes, myIngredients } = state
  const catalogue = useMemo(
    () => withMyContent(builtIn, { myRecipes, myIngredients }),
    [builtIn, myRecipes, myIngredients],
  )
  const dismissProblem = useCallback(() => setProblem(undefined), [])
  const { corruptCopyKey } = loaded
  const readCorruptCopy = useMemo(
    () => (corruptCopyKey ? () => storage.getItem(corruptCopyKey) : undefined),
    [corruptCopyKey, storage],
  )

  const store = useMemo(
    () => ({ state, dispatch, catalogue, problem, dismissProblem, readCorruptCopy }),
    [state, dispatch, catalogue, problem, dismissProblem, readCorruptCopy],
  )
  return <StoreContext value={store}>{children}</StoreContext>
}
