import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseHash, routeToHash, type Route } from './routes'
import { NavigationContext } from './useNavigation'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = useCallback((next: Route) => {
    // Setting the hash adds a history entry and fires hashchange, which updates state.
    const hash = routeToHash(next)
    if (window.location.hash !== hash) window.location.hash = hash
  }, [])

  const navigation = useMemo(() => ({ route, go }), [route, go])
  return <NavigationContext value={navigation}>{children}</NavigationContext>
}
