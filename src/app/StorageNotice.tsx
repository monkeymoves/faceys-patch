import { Notice } from '../ui/Notice'
import { useStore, type StorageProblem } from './useStore'

const MESSAGES: Record<StorageProblem, { title: string; text: string }> = {
  'recovered-corrupt': {
    title: "We couldn't read your saved patch",
    text: "So we've started afresh. A copy of the old data is kept on this device.",
  },
  'storage-unavailable': {
    title: "This browser isn't letting us save",
    text: "You can carry on, but changes will be lost when you close the app. Private browsing often causes this.",
  },
  'save-quota': {
    title: 'Your device is full',
    text: "Your latest changes haven't been saved. Free up some space, or download a backup from Settings.",
  },
  'save-failed': {
    title: "Your latest changes haven't been saved",
    text: 'Try again in a moment, or download a backup from Settings.',
  },
}

/** Says plainly when saved data is at risk. Never fails silently. */
export function StorageNotice() {
  const { problem, dismissProblem } = useStore()
  if (!problem) return null
  const { title, text } = MESSAGES[problem]
  return (
    <Notice tone="problem" title={title} onDismiss={dismissProblem}>
      {text}
    </Notice>
  )
}
