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
  /** Grow only: open this crop's growing guide. */
  crop?: IngredientId
}

const TAB_IDS: ReadonlySet<string> = new Set(MAIN_TABS.map((tab) => tab.id))
const isTab = (value: string): value is MainTabId => TAB_IDS.has(value)

/** The one query parameter a tab understands, if any. */
const PARAMS: Partial<Record<MainTabId, 'with' | 'crop'>> = { cook: 'with', grow: 'crop' }

export function parseHash(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?')
  const tab = isTab(path) ? path : 'patch'
  const param = PARAMS[tab]
  const value = param ? new URLSearchParams(query).get(param) : null
  return param && value ? { tab, [param]: value } : { tab }
}

export function routeToHash(route: Route): string {
  const param = PARAMS[route.tab]
  const value = param ? route[param] : undefined
  const query = param && value ? `?${new URLSearchParams({ [param]: value })}` : ''
  return `#/${route.tab}${query}`
}
