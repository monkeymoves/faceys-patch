import { useEffect, useRef } from 'react'
import { SETTLE_MS } from '../../ui/useAnnouncer'

/**
 * Reads out how many results a search found ('3 crops found.') once typing
 * settles, through `announce` from useAnnouncer. Says nothing for an empty search.
 */
export function useResultsAnnouncement(
  announce: (text: string, wait?: number) => void,
  query: string,
  message: string,
): void {
  const searching = useRef(false)
  useEffect(() => {
    if (query.trim() === '') {
      // Cleared: drop a count still waiting to be read.
      if (searching.current) announce('')
      searching.current = false
      return
    }
    searching.current = true
    announce(message, SETTLE_MS)
  }, [announce, query, message])
}
