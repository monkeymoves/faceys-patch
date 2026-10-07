import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Announcer } from './Announcer'
import { SETTLE_MS, useAnnouncer } from './useAnnouncer'

function Harness() {
  const [message, announce] = useAnnouncer()
  return (
    <>
      <Announcer message={message} />
      <button type="button" onClick={() => announce('Added kale to the patch.')}>
        Add kale
      </button>
      <button type="button" onClick={() => announce('3 crops found.', SETTLE_MS)}>
        Search
      </button>
    </>
  )
}

describe('Announcer and useAnnouncer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is a polite live region that is there, empty, from the start', () => {
    render(<Harness />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  it('reads out each message, and the same one again when it is repeated', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const region = screen.getByRole('status')

    await user.click(screen.getByRole('button', { name: 'Add kale' }))
    const first = region.textContent
    expect(first?.trim()).toBe('Added kale to the patch.')

    await user.click(screen.getByRole('button', { name: 'Add kale' }))
    // A real change in the text, so screen readers say it again.
    expect(region.textContent).not.toBe(first)
    expect(region.textContent?.trim()).toBe('Added kale to the patch.')
  })

  it('waits for typing to settle when asked, keeping only the last message', () => {
    vi.useFakeTimers()
    render(<Harness />)
    const region = screen.getByRole('status')
    act(() => screen.getByRole('button', { name: 'Search' }).click())
    act(() => screen.getByRole('button', { name: 'Search' }).click())
    expect(region).toBeEmptyDOMElement()
    act(() => vi.advanceTimersByTime(SETTLE_MS))
    expect(region.textContent?.trim()).toBe('3 crops found.')
  })
})
