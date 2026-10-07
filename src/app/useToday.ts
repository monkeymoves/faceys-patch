import { useEffect, useState } from 'react'
import { todayISO, type ISODate } from '../domain'

const CHECK_EVERY_MS = 60_000
const systemClock = () => new Date()

/**
 * Today's date, kept fresh when an installed app is left open overnight or
 * brought back from the background.
 */
export function useToday(now: () => Date = systemClock): ISODate {
  const [today, setToday] = useState(() => todayISO(now()))

  useEffect(() => {
    const refresh = () => setToday(todayISO(now()))
    const timer = window.setInterval(refresh, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [now])

  return today
}
