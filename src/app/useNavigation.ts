import { createContext, use } from 'react'
import type { Route } from './routes'

export interface GoOptions {
  /** Replace the current history entry instead of adding one, e.g. when closing something the address opened. */
  replace?: boolean
}

export interface Navigation {
  route: Route
  go: (route: Route, options?: GoOptions) => void
}

export const NavigationContext = createContext<Navigation | null>(null)

export function useNavigation(): Navigation {
  const navigation = use(NavigationContext)
  if (!navigation) throw new Error('useNavigation must be used inside <NavigationProvider>')
  return navigation
}
