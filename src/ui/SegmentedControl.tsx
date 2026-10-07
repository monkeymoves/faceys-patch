import { useRef, type KeyboardEvent } from 'react'
import { cx } from './cx'
import styles from './SegmentedControl.module.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group, e.g. 'View' or 'Show'. */
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

const NEXT = new Set(['ArrowRight', 'ArrowDown'])
const PREV = new Set(['ArrowLeft', 'ArrowUp'])

/** A radio group drawn as joined segments. Arrow keys move and select, Home and End jump. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  function select(index: number) {
    const option = options[index]
    if (!option) return
    refs.current[index]?.focus()
    if (option.value !== value) onChange(option.value)
  }

  function onKeyDown(event: KeyboardEvent) {
    const count = options.length
    let index: number | null = null
    if (NEXT.has(event.key)) index = (selected + 1) % count
    else if (PREV.has(event.key)) index = (selected - 1 + count) % count
    else if (event.key === 'Home') index = 0
    else if (event.key === 'End') index = count - 1
    if (index === null) return
    event.preventDefault()
    select(index)
  }

  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.group, className)} onKeyDown={onKeyDown}>
      {options.map((option, index) => {
        const checked = index === selected
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={cx(styles.segment, checked && styles.checked)}
            onClick={() => select(index)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
