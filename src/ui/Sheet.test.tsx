import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { Sheet } from './Sheet'

function SheetHarness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Courgettes
      </button>
      <Sheet
        open={open}
        title="Courgettes"
        onClose={() => {
          onClose?.()
          setOpen(false)
        }}
      >
        <p>Loads of them.</p>
        <button type="button">Mark as glut</button>
      </Sheet>
    </>
  )
}

async function openSheet() {
  const user = userEvent.setup()
  render(<SheetHarness />)
  const trigger = screen.getByRole('button', { name: 'Courgettes' })
  await user.click(trigger)
  return { user, trigger }
}

describe('Sheet', () => {
  it('opens as a modal dialog named by its title, with focus inside', async () => {
    await openSheet()
    const dialog = screen.getByRole('dialog', { name: 'Courgettes' })
    expect(dialog).toHaveTextContent('Loads of them.')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it('closes on Escape and hands focus back to the trigger', async () => {
    const { user, trigger } = await openSheet()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes from the close button and hands focus back', async () => {
    const { user, trigger } = await openSheet()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes when the backdrop is tapped, but not when the content is', async () => {
    const { user } = await openSheet()
    await user.click(screen.getByText('Loads of them.'))
    const dialog = screen.getByRole('dialog')
    // A tap on the ::backdrop lands on the dialog element itself.
    await user.click(dialog)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not render its content while closed', () => {
    render(<SheetHarness />)
    expect(screen.queryByText('Loads of them.')).not.toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('confirms or cancels through clearly named buttons', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Start afresh?"
        message="This clears everything on this device."
        confirmLabel="Clear everything"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Start afresh?' })
    expect(dialog).toHaveTextContent('This clears everything on this device.')
    // Destructive: focus starts on Cancel so a stray Enter does no harm.
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Clear everything' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
