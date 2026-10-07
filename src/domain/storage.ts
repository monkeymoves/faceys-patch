import { appStateSchema } from './schema'
import { initialState } from './state'
import type { AppState } from './types'

export const STORAGE_KEY = 'faceys-patch.v1'
export const MAX_BACKUP_BYTES = 1_000_000
const BACKUP_APP = 'faceys-patch'

/** The two methods of localStorage we use, so tests can pass a fake (including one that throws). */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type LoadNotice = 'recovered-corrupt' | 'storage-unavailable'

export interface LoadResult {
  state: AppState
  notice?: LoadNotice
}

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' }

export type BackupProblem = 'too-big' | 'not-json' | 'not-backup' | 'invalid'

export type ParseBackupResult = { ok: true; state: AppState } | { ok: false; reason: BackupProblem; error: string }

const BACKUP_ERRORS: Record<BackupProblem, string> = {
  'too-big': "That file is too big to be a Facey's Patch backup.",
  'not-json': "That file can't be read. Choose a backup saved from Facey's Patch.",
  'not-backup': "That file isn't a Facey's Patch backup.",
  invalid: "That backup is damaged, so it can't be loaded. Nothing has been changed.",
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

/**
 * Reads saved state. Anything unreadable is copied to
 * `faceys-patch.v1.corrupt.<timestamp>` before starting fresh, so nothing is
 * ever silently lost; the notice tells the UI to say so.
 */
export function loadState(storage: KeyValueStorage, now: () => Date = () => new Date()): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { state: initialState(), notice: 'storage-unavailable' }
  }
  if (raw === null) return { state: initialState() }

  const json = parseJson(raw)
  const parsed = json.ok ? appStateSchema.safeParse(json.value) : undefined
  if (parsed?.success) return { state: parsed.data }

  try {
    storage.setItem(`${STORAGE_KEY}.corrupt.${now().getTime()}`, raw)
  } catch {
    // No safe copy could be kept, so don't claim one was.
    return { state: initialState(), notice: 'storage-unavailable' }
  }
  return { state: initialState(), notice: 'recovered-corrupt' }
}

const QUOTA_ERRORS = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])

/** Checked by name, because DOMException is not an Error subclass everywhere. */
function isQuotaError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && QUOTA_ERRORS.has(String(error.name))
}

export function saveState(storage: KeyValueStorage, state: AppState): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' }
  }
}

export function serializeBackup(state: AppState, now: Date): string {
  // exportedAt is an instant, not a calendar date, so UTC ISO time is right here.
  return JSON.stringify({ app: BACKUP_APP, exportedAt: now.toISOString(), state }, null, 2)
}

const fail = (reason: BackupProblem): ParseBackupResult => ({ ok: false, reason, error: BACKUP_ERRORS[reason] })

/** Checks an imported backup file. Untrusted: size-capped before parsing, then schema-validated. */
export function parseBackup(text: string): ParseBackupResult {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) return fail('too-big')
  const json = parseJson(text)
  if (!json.ok) return fail('not-json')
  const { value } = json
  if (typeof value !== 'object' || value === null || !('app' in value) || value.app !== BACKUP_APP) {
    return fail('not-backup')
  }
  const parsed = appStateSchema.safeParse('state' in value ? value.state : undefined)
  return parsed.success ? { ok: true, state: parsed.data } : fail('invalid')
}
