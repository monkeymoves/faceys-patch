import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToday } from './useToday'

describe('useToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rolls over to the new date when the app is left open past midnight', () => {
    vi.useFakeTimers()
    let now = new Date(2026, 9, 7, 23, 59)
    const clock = () => now
    const { result } = renderHook(() => useToday(clock))
    expect(result.current).toBe('2026-10-07')

    now = new Date(2026, 9, 8, 0, 1)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current).toBe('2026-10-08')
  })

  it('checks again when the app comes back to the foreground', () => {
    let now = new Date(2026, 9, 7, 12, 0)
    const clock = () => now
    const { result } = renderHook(() => useToday(clock))

    now = new Date(2026, 9, 9, 8, 0)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe('2026-10-09')
  })
})
