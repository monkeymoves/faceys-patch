import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseHash, routeToHash, type Route } from './routes'
import { NavigationContext, type GoOptions } from './useNavigation'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = useCallback((next: Route, options?: GoOptions) => {
    const hash = routeToHash(next)
    if (window.location.hash === hash) return
    if (options?.replace) {
      // Swap the current entry rather than add one, so Back doesn't return to
      // it. replaceState fires no hashchange, so update the route by hand.
      window.history.replaceState(window.history.state, '', hash)
      setRoute(parseHash(hash))
      return
    }
    // Setting the hash adds a history entry and fires hashchange, which updates state.
    window.location.hash = hash
  }, [])

  const navigation = useMemo(() => ({ route, go }), [route, go])
  return <NavigationContext value={navigation}>{children}</NavigationContext>
}
