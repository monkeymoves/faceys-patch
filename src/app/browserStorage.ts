import type { KeyValueStorage } from '../domain'

/**
 * localStorage, touched lazily: in some Safari modes even reading
 * `window.localStorage` throws, and this way that throw lands inside the
 * domain's try/catch rather than crashing the app.
 */
export const browserStorage: KeyValueStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}
