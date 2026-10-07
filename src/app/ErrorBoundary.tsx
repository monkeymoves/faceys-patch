import { Component, type ErrorInfo, type ReactNode } from 'react'
import { initialState, STORAGE_KEY, toISODate } from '../domain'
import { browserStorage } from './browserStorage'
import { downloadFile } from './download'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  crashed: boolean
}

/**
 * The last line of defence: if anything fails while drawing the app, show a
 * way out instead of a blank screen. Deliberately plain, using no app
 * components or state, since one of those may be what broke.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console for anyone debugging; nothing is sent anywhere.
    console.error("Facey's Patch crashed", error, info.componentStack)
  }

  override render() {
    if (!this.state.crashed) return this.props.children
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Something's gone wrong</h1>
        <p>Your patch, plans and recipes are still saved on this device.</p>
        <p>Try reloading. If it keeps happening, download your data to keep it safe, then start afresh.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Reload
          </button>
          <button type="button" onClick={downloadSavedData}>
            Download your data
          </button>
          <button type="button" onClick={startAfresh}>
            Start afresh
          </button>
        </div>
      </main>
    )
  }
}

function readSaved(): string | null {
  try {
    return browserStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function downloadSavedData() {
  const saved = readSaved()
  if (saved === null) {
    window.alert('There was no saved data to download.')
    return
  }
  downloadFile(`faceys-patch-backup-${toISODate(new Date())}.json`, saved)
}

function startAfresh() {
  if (!window.confirm('Start afresh? This clears your patch, larder, plans and recipes on this device. A copy of the old data is kept.')) return
  try {
    const saved = readSaved()
    if (saved !== null) browserStorage.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, saved)
    browserStorage.setItem(STORAGE_KEY, JSON.stringify(initialState()))
  } catch {
    window.alert("This browser isn't letting us change saved data, so nothing has been changed.")
    return
  }
  window.location.reload()
}
