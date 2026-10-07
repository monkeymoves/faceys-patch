import { createContext, use } from 'react'
import type { ISODate } from '../domain'

export interface ViewedWeek {
  /** The Monday of the week shown on the Week and Shop screens. */
  weekStart: ISODate
  /** Any date in the week to show. Snaps to its Monday. */
  showWeekOf: (date: ISODate) => void
  /** The Monday of the current week. */
  thisWeek: ISODate
}

export const ViewedWeekContext = createContext<ViewedWeek | null>(null)

export function useViewedWeek(): ViewedWeek {
  const value = use(ViewedWeekContext)
  if (!value) throw new Error('useViewedWeek must be used inside <ViewedWeekProvider>')
  return value
}
