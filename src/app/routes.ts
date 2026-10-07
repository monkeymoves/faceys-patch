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
