import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'

/**
 * Offers a new version once it has downloaded, rather than reloading on its
 * own, so nobody loses a half-written recipe. Everything else is saved on
 * every change, so updating is always safe.
 */
export function UpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <Notice
      title="A new version is ready"
      onDismiss={() => setNeedRefresh(false)}
      dismissLabel="Not now"
      action={
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          Update now
        </Button>
      }
    >
      Your patch, plans and recipes stay just as they are.
    </Notice>
  )
}
