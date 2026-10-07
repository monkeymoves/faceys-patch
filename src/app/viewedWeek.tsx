import { useMemo, useState, type ReactNode } from 'react'
import { startOfWeek, type ISODate } from '../domain'
import { useToday } from './useToday'
import { ViewedWeekContext } from './useViewedWeek'

/**
 * Shared between Week and Shop, so planning next week and then opening Shop
 * shows next week's list. Not saved: the app always opens on this week.
 */
export function ViewedWeekProvider({ children }: { children: ReactNode }) {
  const thisWeek = startOfWeek(useToday())
  const [chosen, setChosen] = useState<ISODate | null>(null)
  const weekStart = chosen ?? thisWeek

  const value = useMemo(
    () => ({ weekStart, thisWeek, showWeekOf: (date: ISODate) => setChosen(startOfWeek(date)) }),
    [weekStart, thisWeek],
  )
  return <ViewedWeekContext value={value}>{children}</ViewedWeekContext>
}
