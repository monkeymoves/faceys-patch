import { useId, type ReactNode } from 'react'
import { Art } from '../art/Art'
import type { ArtKey } from '../domain/types'
import { cx } from './cx'
import { Checkbox } from './Checkbox'
import { FieldError } from './Field'
import { IconButton } from './IconButton'
import styles from './IngredientRow.module.css'

export interface IngredientRowProps {
  name: string
  /** A drawing for patch veg; omit for larder things. */
  art?: ArtKey
  amount: string
  onAmountChange: (amount: string) => void
  optional: boolean
  onOptionalChange: (optional: boolean) => void
  onRemove: () => void
  amountPlaceholder?: string
  /** The longest amount allowed, e.g. LIMITS.amountLength. */
  amountMaxLength?: number
  /** Shown under the row in tomato, and marks the amount aria-invalid. */
  error?: ReactNode
  className?: string
}

/** One ingredient in the recipe form: name, amount, an optional tick, and remove. */
export function IngredientRow({
  name,
  art,
  amount,
  onAmountChange,
  optional,
  onOptionalChange,
  onRemove,
  amountPlaceholder = 'e.g. 2 handfuls',
  amountMaxLength,
  error,
  className,
}: IngredientRowProps) {
  const nameId = useId()
  const amountId = useId()
  const errorId = useId()
  return (
    <div role="group" aria-labelledby={nameId} className={cx(styles.row, className)}>
      <div className={styles.head}>
        {art && <Art name={art} size={36} className={styles.art} />}
        <span id={nameId} className={styles.name}>
          {name}
        </span>
        <IconButton icon="bin" label={`Remove ${name}`} onClick={onRemove} className={styles.remove} />
      </div>
      <div className={styles.controls}>
        <label htmlFor={amountId} className="visually-hidden">
          Amount of {name}
        </label>
        <input
          id={amountId}
          type="text"
          className={styles.amount}
          value={amount}
          placeholder={amountPlaceholder}
          maxLength={amountMaxLength}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <Checkbox label="Optional" checked={optional} onCheckedChange={onOptionalChange} className={styles.optional} />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
