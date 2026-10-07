import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PeriodNav } from './PeriodNav'

function Harness() {
  const [offset, setOffset] = useState(0)
  return (
    <PeriodNav
      label={offset === 0 ? 'This week, 5 to 11 October' : `Week ${offset}`}
      previousLabel="Previous week"
      nextLabel="Next week"
      onPrevious={() => setOffset(offset - 1)}
      onNext={() => setOffset(offset + 1)}
      jump={offset === 0 ? undefined : { label: 'Back to this week', onClick: () => setOffset(0) }}
    />
  )
}

describe('PeriodNav', () => {
  it('says what is on show in plain text between named previous and next buttons', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByText('This week, 5 to 11 October')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByText('Week 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    await user.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(screen.getByText('Week -1')).toBeInTheDocument()
  })

  it('jumps back to now, then hands focus to the previous button as the jump goes away', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    await user.click(screen.getByRole('button', { name: 'Back to this week' }))
    expect(screen.getByText('This week, 5 to 11 October')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to this week' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toHaveFocus()
  })
})
