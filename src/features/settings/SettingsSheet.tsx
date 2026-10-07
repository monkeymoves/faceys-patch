import { useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useStore } from '../../app/useStore'
import { BACKUP_ERRORS, MAX_BACKUP_BYTES, parseBackup, type AppState } from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Notice, type NoticeTone } from '../../ui/Notice'
import { Sheet } from '../../ui/Sheet'
import { useAnnouncer } from '../../ui/useAnnouncer'
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

/** Some browsers (an iPhone home screen app, for one) can quietly block a download, so don't promise. */
const downloaded = (now: Date) => `Your backup should now be in your downloads (${backupFileName(now)}).`
const NOT_MADE = "The backup couldn't be made. Try again in a moment."

/**
 * Backups, starting afresh and installing the app. The confirms sit beside the
 * sheet rather than inside it, so closing one never closes the sheet too.
 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { state, dispatch } = useStore()
  const [message, setMessage] = useState<Message | null>(null)
  const [backup, setBackup] = useState<AppState | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  /** What happened to "Download a backup first", shown inside the Start afresh confirm. */
  const [resetBackupNote, setResetBackupNote] = useState('')
  const [confirmAnnouncement, announceInConfirm] = useAnnouncer()
  const fileInput = useRef<HTMLInputElement>(null)

  const say = (section: Message['section'], tone: NoticeTone, text: string) => setMessage({ section, tone, text })

  function close() {
    setMessage(null)
    onClose()
  }

  /** Downloads a backup and says how it went. */
  function makeBackup(): { ok: boolean; text: string } {
    const now = new Date()
    try {
      downloadBackup(state, now)
      return { ok: true, text: downloaded(now) }
    } catch {
      return { ok: false, text: NOT_MADE }
    }
  }

  function download() {
    const { ok, text } = makeBackup()
    say('backup', ok ? 'success' : 'problem', text)
  }

  function downloadBeforeReset() {
    const { text } = makeBackup()
    setResetBackupNote(text)
    announceInConfirm(text)
  }

  function closeResetConfirm() {
    setConfirmingReset(false)
    setResetBackupNote('')
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    // Clear it so choosing the same file again still counts as a change.
    input.value = ''
    if (!file) return
    setMessage(null)
    if (file.size > MAX_BACKUP_BYTES) {
      say('backup', 'problem', BACKUP_ERRORS['too-big'])
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      say('backup', 'problem', BACKUP_ERRORS['not-json'])
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
    closeResetConfirm()
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
            <p className={styles.text}>
              Everything lives only on this device, so downloading a backup now and then is wise. Keep it somewhere
              safe, or use it to move everything to a new phone.
            </p>
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
            <p className={styles.text}>
              <strong>On iPhone, do add it to your Home Screen.</strong> Safari can clear a website's data if you
              haven't visited for a week or so, but Home Screen apps keep theirs.
            </p>
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
            {resetBackupNote && <p className={styles.confirmNote}>{resetBackupNote}</p>}
            <Announcer message={confirmAnnouncement} />
          </div>
        }
        confirmLabel="Clear everything"
        destructive
        otherAction={{ label: 'Download a backup first', icon: 'download', onClick: downloadBeforeReset }}
        onConfirm={startAfresh}
        onCancel={closeResetConfirm}
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
