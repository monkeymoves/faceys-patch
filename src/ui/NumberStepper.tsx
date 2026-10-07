import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'
import { FieldError, FieldHint, FieldLabel } from './Field'
import { describedBy, useFieldIds } from './field-utils'
import { IconButton } from './IconButton'
import styles from './NumberStepper.module.css'

export interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Shown after the number and read out with it, e.g. 'min'. */
  unit?: string
  hint?: ReactNode
  error?: ReactNode
  decreaseLabel?: string
  increaseLabel?: string
  className?: string
}

/** Minus and plus buttons round a number you can also type. Arrow keys step too. */
export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  hint,
  error,
  decreaseLabel = `Decrease ${label.toLowerCase()}`,
  increaseLabel = `Increase ${label.toLowerCase()}`,
  className,
}: NumberStepperProps) {
  const ids = useFieldIds()
  // While typing, keep the raw text; commit it on blur or Enter.
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  function set(next: number) {
    const clamped = clamp(next)
    if (clamped !== value) onChange(clamped)
  }

  function commit() {
    if (draft === null) return
    const parsed = Number.parseInt(draft, 10)
    setDraft(null)
    if (!Number.isNaN(parsed)) set(parsed)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit()
      return
    }
    const delta = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0
    if (delta === 0) return
    event.preventDefault()
    setDraft(null)
    set(value + delta)
  }

  return (
    <div className={cx(styles.field, className)}>
      <FieldLabel htmlFor={ids.control}>{label}</FieldLabel>
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
      <div className={styles.control}>
        {/* aria-disabled, not disabled: a disabled button drops keyboard focus to the page. */}
        <IconButton
          icon="minus"
          label={decreaseLabel}
          variant="secondary"
          size="lg"
          aria-disabled={value <= min ? true : undefined}
          onClick={() => {
            if (value > min) set(value - step)
          }}
        />
        <span className={styles.numberWrap}>
          <input
            id={ids.control}
            type="text"
            inputMode="numeric"
            role="spinbutton"
            autoComplete="off"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={unit ? `${value} ${unit}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(hint && ids.hint, error && ids.error)}
            className={styles.input}
            value={draft ?? String(value)}
            onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ''))}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
          {unit && (
            <span className={styles.unit} aria-hidden="true">
              {unit}
            </span>
          )}
        </span>
        <IconButton
          icon="plus"
          label={increaseLabel}
          variant="secondary"
          size="lg"
          aria-disabled={value >= max ? true : undefined}
          onClick={() => {
            if (value < max) set(value + step)
          }}
        />
      </div>
      {error && <FieldError id={ids.error}>{error}</FieldError>}
    </div>
  )
}
