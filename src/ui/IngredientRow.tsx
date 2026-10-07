import { useId } from 'react'
import { Art } from '../art/Art'
import type { ArtKey } from '../domain/types'
import { cx } from './cx'
import { Checkbox } from './Checkbox'
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
  className,
}: IngredientRowProps) {
  const nameId = useId()
  const amountId = useId()
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
          maxLength={40}
          autoComplete="off"
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <Checkbox label="Optional" checked={optional} onCheckedChange={onOptionalChange} className={styles.optional} />
      </div>
    </div>
  )
}
