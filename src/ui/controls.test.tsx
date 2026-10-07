import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'
import { IconButton } from './IconButton'
import { SegmentedControl } from './SegmentedControl'
import { MAIN_TABS, TabBar, type MainTabId } from './TabBar'
import { ToggleChip } from './ToggleChip'

describe('ToggleChip', () => {
  it('exposes its state with aria-pressed and flips it when pressed', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [on, setOn] = useState(false)
      return (
        <ToggleChip pressed={on} onPressedChange={setOn}>
          Olive oil
        </ToggleChip>
      )
    }
    render(<Harness />)
    const chip = screen.getByRole('button', { name: 'Olive oil' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard(' ')
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('Checkbox', () => {
  it('is a real checkbox, named by its label and described by its hint', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    function Harness() {
      const [checked, setChecked] = useState(false)
      return (
        <Checkbox
          label="Lemons"
          hint="for Bean salad"
          checked={checked}
          onCheckedChange={(next) => {
            onCheckedChange(next)
            setChecked(next)
          }}
        />
      )
    }
    render(<Harness />)
    const box = screen.getByRole('checkbox', { name: 'Lemons' })
    expect(box).toHaveAccessibleDescription('for Bean salad')
    expect(box).not.toBeChecked()
    await user.click(screen.getByText('Lemons'))
    expect(box).toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    await user.keyboard(' ')
    expect(box).not.toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })
})

describe('SegmentedControl', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'ready', label: 'Ready to cook' },
    { value: 'veggie', label: 'Veggie' },
  ] as const

  function Harness() {
    const [value, setValue] = useState<(typeof options)[number]['value']>('all')
    return <SegmentedControl label="Show" options={options} value={value} onChange={setValue} />
  }

  it('is a radio group with one checked, tabbable option', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup', { name: 'Show' })).toBeInTheDocument()
    const all = screen.getByRole('radio', { name: 'All' })
    expect(all).toHaveAttribute('aria-checked', 'true')
    expect(all).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Veggie' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves and selects with the arrow keys, wrapping round, and jumps with Home and End', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(screen.getByRole('radio', { name: 'All' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    const ready = screen.getByRole('radio', { name: 'Ready to cook' })
    expect(ready).toHaveFocus()
    expect(ready).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'false')

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Veggie' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'All' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'Veggie' })).toHaveFocus()
  })
})

describe('TabBar', () => {
  it('marks the active tab as the current page and reports selections', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn<(id: MainTabId) => void>()
    render(<TabBar tabs={MAIN_TABS} active="cook" onSelect={onSelect} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cook' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Patch' })).not.toHaveAttribute('aria-current')
    await user.click(screen.getByRole('button', { name: 'Shop' }))
    expect(onSelect).toHaveBeenCalledWith('shop')
  })

  it('lists the five tabs in order', () => {
    render(<TabBar tabs={MAIN_TABS} active="patch" onSelect={() => {}} />)
    expect(screen.getAllByRole('button').map((tab) => tab.textContent)).toEqual([
      'Patch',
      'Larder',
      'Cook',
      'Week',
      'Shop',
    ])
  })
})

describe('IconButton', () => {
  it('takes its accessible name from the required label', () => {
    render(<IconButton icon="settings" label="Settings" />)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('will not type-check without a label', () => {
    // @ts-expect-error label is required: an icon alone has no accessible name
    const element = <IconButton icon="plus" />
    expect(element).toBeTruthy()
  })
})
