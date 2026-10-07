import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { IngredientId } from '../domain'
import { MAIN_TABS, type MainTabId } from '../ui/TabBar'

/**
 * Where the person is. Kept in the URL hash (`#/cook?with=courgette`) so the
 * browser and Android back buttons move between tabs, and a refresh stays put.
 */
export interface Route {
  tab: MainTabId
  /** Cook only: show recipes using this patch ingredient first. */
  with?: IngredientId
}

const TAB_IDS: ReadonlySet<string> = new Set(MAIN_TABS.map((tab) => tab.id))
const isTab = (value: string): value is MainTabId => TAB_IDS.has(value)

export function parseHash(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?')
  const tab = isTab(path) ? path : 'patch'
  const withId = new URLSearchParams(query).get('with')
  return tab === 'cook' && withId ? { tab, with: withId } : { tab }
}

export function routeToHash(route: Route): string {
  const query = route.tab === 'cook' && route.with ? `?${new URLSearchParams({ with: route.with })}` : ''
  return `#/${route.tab}${query}`
}

interface Navigation {
  route: Route
  go: (route: Route) => void
}

const NavigationContext = createContext<Navigation | null>(null)

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

export function useNavigation(): Navigation {
  const navigation = use(NavigationContext)
  if (!navigation) throw new Error('useNavigation must be used inside <NavigationProvider>')
  return navigation
}
