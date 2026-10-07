import { useCallback, useEffect, useRef, useState } from 'react'

/** Pass to announce() to wait for typing to settle, e.g. for search result counts. */
export const SETTLE_MS = 500

/**
 * Text for an <Announcer>, and a function to say something through it.
 * `announce(text, wait)` replaces anything still waiting; the same text twice
 * is still read twice.
 */
export function useAnnouncer(): [message: string, announce: (text: string, wait?: number) => void] {
  const [said, setSaid] = useState({ text: '', count: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const announce = useCallback((text: string, wait = 0) => {
    clearTimeout(timer.current)
    const say = () => setSaid((current) => ({ text, count: current.count + 1 }))
    if (wait > 0) timer.current = setTimeout(say, wait)
    else say()
  }, [])

  // A trailing no-break space on every other message makes a repeat count as a change.
  const message = said.text === '' ? '' : said.text + (said.count % 2 === 0 ? ' ' : '')
  return [message, announce]
}
