import { useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useStore } from '../../app/useStore'
import { MAX_BACKUP_BYTES, parseBackup, type AppState } from '../../domain'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Notice, type NoticeTone } from '../../ui/Notice'
import { Sheet } from '../../ui/Sheet'
import { backupFileName, backupSummary, downloadBackup } from './backupFile'
import styles from './Settings.module.css'

export interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

interface Message {
  tone: NoticeTone
  text: string
  /** Shown beside the section it's about. */
  section: 'backup' | 'reset'
}

const TOO_BIG = "That file is too big to be a Facey's Patch backup."
const UNREADABLE = "That file can't be read. Choose a backup saved from Facey's Patch."

/**
 * Backups, starting afresh and installing the app. The confirms sit beside the
 * sheet rather than inside it, so closing one never closes the sheet too.
 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { state, dispatch } = useStore()
  const [message, setMessage] = useState<Message | null>(null)
  const [backup, setBackup] = useState<AppState | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const say = (section: Message['section'], tone: NoticeTone, text: string) => setMessage({ section, tone, text })

  function close() {
    setMessage(null)
    onClose()
  }

  function download() {
    const now = new Date()
    try {
      downloadBackup(state, now)
      say('backup', 'success', `Backup saved as ${backupFileName(now)}. Keep it somewhere safe.`)
    } catch {
      say('backup', 'problem', "The backup couldn't be made. Try again in a moment.")
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    // Clear it so choosing the same file again still counts as a change.
    input.value = ''
    if (!file) return
    setMessage(null)
    if (file.size > MAX_BACKUP_BYTES) {
      say('backup', 'problem', TOO_BIG)
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      say('backup', 'problem', UNREADABLE)
      return
    }
    const result = parseBackup(text)
    if (result.ok) setBackup(result.state)
    else say('backup', 'problem', result.error)
  }

  function replaceEverything() {
    if (!backup) return
    dispatch({ type: 'state/replace', state: backup })
    setBackup(null)
    say('backup', 'success', 'Backup loaded. Everything is as it was when it was saved.')
  }

  function startAfresh() {
    dispatch({ type: 'state/reset' })
    setConfirmingReset(false)
    say('reset', 'success', "All cleared. Here's to a fresh start.")
  }

  const notice = (section: Message['section']) =>
    message?.section === section && (
      <Notice tone={message.tone} onDismiss={() => setMessage(null)}>
        {message.text}
      </Notice>
    )

  return (
    <>
      <Sheet open={open} onClose={close} title="Settings">
        <div className={styles.settings}>
          <p className={styles.lede}>Everything is saved on this device. Nothing is sent anywhere.</p>

          <Section title="Backup">
            <p className={styles.text}>Keep a copy somewhere safe, or use one to move everything to a new phone.</p>
            <div className={styles.buttons}>
              <Button variant="secondary" icon="download" onClick={download}>
                Download a backup
              </Button>
              <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
                Load a backup
              </Button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              aria-label="Backup file"
              tabIndex={-1}
              hidden
              onChange={chooseFile}
            />
            {notice('backup')}
          </Section>

          <Section title="Use it like an app">
            <p className={styles.text}>Put it on your home screen and it opens full screen, even without signal.</p>
            <ul className={styles.steps}>
              <li>
                <strong>iPhone, in Safari:</strong> tap Share, then Add to Home Screen.
              </li>
              <li>
                <strong>Android, in Chrome:</strong> tap the menu, then Install app.
              </li>
            </ul>
          </Section>

          <Section title="Start afresh">
            <p className={styles.text}>Clears everything on this device, so you can begin again.</p>
            <div className={styles.buttons}>
              <Button variant="secondary" icon="bin" onClick={() => setConfirmingReset(true)}>
                Start afresh
              </Button>
            </div>
            {notice('reset')}
          </Section>
        </div>
      </Sheet>

      <ConfirmDialog
        open={backup !== null}
        title="Replace everything with this backup?"
        message={
          <div className={styles.confirmText}>
            <p>{backup && backupSummary(backup)}</p>
            <p>What's on this device now will be replaced.</p>
          </div>
        }
        confirmLabel="Replace everything"
        destructive
        onConfirm={replaceEverything}
        onCancel={() => setBackup(null)}
      />
      <ConfirmDialog
        open={confirmingReset}
        title="Start afresh?"
        message={
          <div className={styles.confirmText}>
            <p>This clears your patch, larder, plans and your own recipes on this device. It can't be undone.</p>
            <p>You might like to download a backup first.</p>
          </div>
        }
        confirmLabel="Clear everything"
        destructive
        onConfirm={startAfresh}
        onCancel={() => setConfirmingReset(false)}
      />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h3 id={headingId} className={styles.heading}>
        {title}
      </h3>
      {children}
    </section>
  )
}
