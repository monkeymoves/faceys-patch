import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** raised: white card on paper. sunken: a recessed paper-2 panel. */
  tone?: 'raised' | 'sunken'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'section' | 'article' | 'li'
  children?: ReactNode
}

/** A plain surface with a hand-cut edge. No shadow. */
export function Card({ tone = 'raised', padding = 'md', as = 'div', className, ...rest }: CardProps) {
  // All four tags take the same HTML attributes, so typing it as a div is safe.
  const Tag = as as 'div'
  return <Tag className={cx(styles.card, styles[tone], styles[`pad-${padding}`], className)} {...rest} />
}
