import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './HandNote.module.css'

export interface HandNoteProps {
  children: ReactNode
  /** pencil is the default grey-brown; leaf and tomato for the odd emphasis. */
  tone?: 'pencil' | 'ink' | 'leaf' | 'tomato'
  tilt?: 'left' | 'right' | 'none'
  size?: 'md' | 'lg'
  className?: string
}

/**
 * A handwritten margin note ("loads!", "ready Sat"). Caveat, never below 20px.
 * At most one per card, and never the only place something you need is written.
 */
export function HandNote({ children, tone = 'pencil', tilt = 'left', size = 'md', className }: HandNoteProps) {
  return <span className={cx(styles.note, styles[tone], styles[`tilt-${tilt}`], styles[size], className)}>{children}</span>
}
