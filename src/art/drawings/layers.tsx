import type { ReactNode } from 'react'
import { INK } from '../palette'

/**
 * How far the colour plate sits from the ink plate, in viewBox units. Down and
 * to the right, like a cheap two-colour screen print that slipped a little.
 */
const REGISTER_X = 1.6
const REGISTER_Y = 1.4

/** The flat colour layer. Shapes inside are filled, never stroked. */
export function Fill({ children }: { children: ReactNode }) {
  return (
    <g transform={`translate(${REGISTER_X} ${REGISTER_Y})`} stroke="none">
      {children}
    </g>
  )
}

/** The pen layer, drawn on top of the colour. Lines only, never filled. */
export function Ink({ children }: { children: ReactNode }) {
  return (
    <g
      fill="none"
      stroke={INK}
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </g>
  )
}
