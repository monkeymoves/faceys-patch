import { serializeBackup, toISODate, type AppState } from '../../domain'

/** 'faceys-patch-backup-2026-10-07.json', dated by the local calendar. */
export const backupFileName = (now: Date) => `faceys-patch-backup-${toISODate(now)}.json`

/**
 * Saves the state as a JSON file through a temporary object URL. The URL is
 * revoked once the browser has had a moment to start the download.
 */
export function downloadBackup(state: AppState, now: Date): void {
  const blob = new Blob([serializeBackup(state, now)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName(now)
  link.hidden = true
  document.body.append(link)
  try {
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url))
  }
}

const count = (n: number, one: string, many: string, none: string) =>
  n === 0 ? none : `${n} ${n === 1 ? one : many}`

/** One line saying what's in a backup, for the confirm before it replaces everything. */
export function backupSummary(state: AppState): string {
  const meals = Object.values(state.plan).reduce((total, day) => total + day.length, 0)
  const parts = [
    count(state.harvest.length, 'thing on the patch', 'things on the patch', 'nothing on the patch'),
    count(state.larder.length, 'thing in the larder', 'things in the larder', 'nothing in the larder'),
    count(meals, 'planned meal', 'planned meals', 'no planned meals'),
    count(state.myRecipes.length, 'recipe of your own', 'recipes of your own', 'no recipes of your own'),
  ]
  return `It has ${new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(parts)}.`
}
