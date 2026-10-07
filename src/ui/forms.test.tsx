import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FieldGroup } from './FieldGroup'
import { IngredientRow } from './IngredientRow'
import { NumberStepper } from './NumberStepper'
import { SearchField } from './SearchField'
import { Select } from './Select'
import { TextArea } from './TextArea'
import { TextField } from './TextField'

describe('TextField', () => {
  it('is labelled, and wires its hint and error into the description', () => {
    render(
      <TextField label="Title" hint="What you call it." error="Give it a name." value="" onChange={() => {}} />,
    )
    const input = screen.getByRole('textbox', { name: 'Title' })
    expect(input).toHaveAccessibleDescription('What you call it. Give it a name.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('is not marked invalid without an error', () => {
    render(<TextField label="Title" value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Title' })).not.toHaveAttribute('aria-invalid')
  })

  it('shows a quiet count only near the limit', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [value, setValue] = useState('Courgette')
      return <TextField label="Title" value={value} onChange={setValue} maxLength={20} />
    }
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Title' })
    expect(screen.queryByText(/of 20/)).not.toBeInTheDocument()
    await user.type(input, 's and mint fritters')
    // maxLength stops typing at the limit
    expect(input).toHaveValue('Courgettes and mint ')
    expect(screen.getByText('20 of 20')).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription('20 of 20')
  })
})

describe('TextArea', () => {
  it('has the same label, hint and error wiring', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextArea label="Method" hint="One step per line." error="Add at least one step." value="" onChange={onChange} />)
    const area = screen.getByRole('textbox', { name: 'Method' })
    expect(area).toHaveAccessibleDescription('One step per line. Add at least one step.')
    expect(area).toHaveAttribute('aria-invalid', 'true')
    await user.type(area, 'S')
    expect(onChange).toHaveBeenCalledWith('S')
  })
})

describe('Select', () => {
  it('is a labelled native select that reports the chosen value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        label="Course"
        value="main"
        onChange={onChange}
        options={[
          { value: 'main', label: 'Main' },
          { value: 'soup', label: 'Soup' },
        ]}
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Course' })
    expect(select).toHaveValue('main')
    await user.selectOptions(select, 'Soup')
    expect(onChange).toHaveBeenCalledWith('soup')
  })
})

describe('NumberStepper', () => {
  function Harness({ onChange }: { onChange?: (n: number) => void }) {
    const [value, setValue] = useState(30)
    return (
      <NumberStepper
        label="Minutes"
        value={value}
        min={5}
        max={40}
        step={5}
        unit="min"
        onChange={(next) => {
          onChange?.(next)
          setValue(next)
        }}
      />
    )
  }

  it('is a labelled spinbutton with named minus and plus buttons', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const spin = screen.getByRole('spinbutton', { name: 'Minutes' })
    expect(spin).toHaveAttribute('aria-valuenow', '30')
    expect(spin).toHaveAttribute('aria-valuetext', '30 min')
    await user.click(screen.getByRole('button', { name: 'Increase minutes' }))
    expect(spin).toHaveValue('35')
    await user.click(screen.getByRole('button', { name: 'Decrease minutes' }))
    await user.click(screen.getByRole('button', { name: 'Decrease minutes' }))
    expect(spin).toHaveValue('25')
  })

  it('stops at the limits and disables the button that would pass them', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const plus = screen.getByRole('button', { name: 'Increase minutes' })
    await user.click(plus)
    await user.click(plus)
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('40')
    expect(plus).toBeDisabled()
  })

  it('takes a typed number on blur, kept within the limits', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const spin = screen.getByRole('spinbutton', { name: 'Minutes' })
    await user.clear(spin)
    await user.type(spin, '12')
    expect(onChange).not.toHaveBeenCalled()
    await user.tab()
    expect(onChange).toHaveBeenLastCalledWith(12)
    await user.clear(spin)
    await user.type(spin, '400{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(40)
    expect(spin).toHaveValue('40')
  })

  it('steps with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const spin = screen.getByRole('spinbutton', { name: 'Minutes' })
    spin.focus()
    await user.keyboard('{ArrowUp}')
    expect(spin).toHaveAttribute('aria-valuenow', '35')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(spin).toHaveAttribute('aria-valuenow', '25')
  })
})

describe('FieldGroup', () => {
  it('groups its controls under the legend', () => {
    render(
      <FieldGroup legend="Ingredients" hint="Salt and pepper are taken as read.">
        <input aria-label="Amount" />
      </FieldGroup>,
    )
    const group = screen.getByRole('group', { name: 'Ingredients' })
    expect(group).toHaveAccessibleDescription('Salt and pepper are taken as read.')
    expect(group).toContainElement(screen.getByRole('textbox', { name: 'Amount' }))
  })
})

describe('IngredientRow', () => {
  it('names its controls after the ingredient and reports each change', async () => {
    const user = userEvent.setup()
    const onAmountChange = vi.fn()
    const onOptionalChange = vi.fn()
    const onRemove = vi.fn()
    render(
      <IngredientRow
        name="Mint"
        art="herb-soft"
        amount=""
        optional={false}
        onAmountChange={onAmountChange}
        onOptionalChange={onOptionalChange}
        onRemove={onRemove}
      />,
    )
    const row = screen.getByRole('group', { name: 'Mint' })
    expect(row).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount of Mint' }), { target: { value: 'a handful' } })
    expect(onAmountChange).toHaveBeenCalledWith('a handful')
    await user.click(screen.getByRole('checkbox', { name: 'Optional' }))
    expect(onOptionalChange).toHaveBeenCalledWith(true)
    await user.click(screen.getByRole('button', { name: 'Remove Mint' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})

describe('SearchField', () => {
  it('is labelled, and its clear button empties it and refocuses the input', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [value, setValue] = useState('')
      return <SearchField label="Find a crop" value={value} onChange={setValue} />
    }
    render(<Harness />)
    const input = screen.getByRole('searchbox', { name: 'Find a crop' })
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    await user.type(input, 'cour')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })
})
