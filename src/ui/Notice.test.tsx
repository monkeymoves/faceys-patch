import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Notice } from './Notice'

describe('Notice', () => {
  it('is a polite status, or an alert for a problem', () => {
    render(
      <>
        <Notice tone="success">Copied to your clipboard.</Notice>
        <Notice tone="problem">The list couldn't be copied.</Notice>
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Copied to your clipboard.')
    expect(screen.getByRole('alert')).toHaveTextContent("The list couldn't be copied.")
  })

  it('stays quiet when the screen reads the message out itself', () => {
    render(
      <Notice tone="problem" live={false}>
        The list couldn't be copied.
      </Notice>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText("The list couldn't be copied.")).toBeInTheDocument()
  })
})
