import { cx } from './cx'
import styles from './MonthStrip.module.css'

/** The four things that can happen to a crop in a month. Each has its own colour and row. */
export type StripTone = 'sowIndoors' | 'sowOutdoors' | 'plantOut' | 'harvest'

export interface MonthStripRow {
  tone: StripTone
  /** 'Sow under cover'. Shown beside the row when not compact, and read out. */
  label: string
  /** Months, 1 to 12. */
  months: readonly number[]
  /** The months in words, e.g. 'February to April'. Read out; the caller formats it. */
  spoken: string
}

export interface MonthStripProps {
  /** Rows with no months are left out when labelled, and drawn empty when compact so each row keeps its place. */
  rows: readonly MonthStripRow[]
  /** 1 to 12: this month's column is marked, so you can see where you are in the year. */
  currentMonth?: number
  /** Thin bars without row labels, for a list under a key. The spoken version stays complete. */
  compact?: boolean
  /** Hidden from assistive tech, because the months are written out in words beside it. */
  decorative?: boolean
  className?: string
}

const INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * A crop's year as a row of twelve cells per activity, like the chart on the
 * back of a seed packet. Drawn for the eye; screen readers get one sentence
 * per row instead ('Sow under cover: February to April.').
 */
export function MonthStrip({ rows, currentMonth, compact = false, decorative = false, className }: MonthStripProps) {
  const shown = compact ? rows : rows.filter((row) => row.months.length > 0)
  const spoken = rows
    .filter((row) => row.months.length > 0)
    .map((row) => `${row.label}: ${row.spoken}.`)
    .join(' ')
  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : spoken || 'Nothing to show yet.'}
      aria-hidden={decorative ? true : undefined}
      className={cx(styles.strip, compact && styles.compact, className)}
    >
      <div className={styles.header}>
        {!compact && <span className={styles.corner} />}
        {MONTHS.map((month, index) => (
          <span key={month} className={cx(styles.initial, month === currentMonth && styles.now)}>
            {INITIALS[index]}
          </span>
        ))}
      </div>
      {shown.map((row) => {
        const filled = new Set(row.months)
        return (
          <div key={row.tone} className={styles.row}>
            {!compact && <span className={styles.label}>{row.label}</span>}
            {MONTHS.map((month) => {
              const on = filled.has(month)
              return (
                <span
                  key={month}
                  className={cx(
                    styles.cell,
                    on && styles.on,
                    on && styles[row.tone],
                    on && !filled.has(month - 1) && styles.start,
                    on && !filled.has(month + 1) && styles.end,
                    month === currentMonth && styles.nowCell,
                  )}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
