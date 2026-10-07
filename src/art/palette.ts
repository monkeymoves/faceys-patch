/**
 * The art palette from docs/DESIGN.md. These are the only colours a drawing
 * may use. Drawings carry their own colours (no CSS variables) so they look
 * the same wherever they are placed.
 */

/** The pen. Every outline and detail stroke. */
export const INK = '#2B2420'

/** Flat fills that sit under the ink, slightly off-register. */
export const FILL = {
  leaf: '#6E9A4F',
  deepLeaf: '#3F6F35',
  paleLeaf: '#A9C487',
  tomato: '#D9533A',
  carrot: '#E7792F',
  squash: '#E8913A',
  marigold: '#EDB33F',
  corn: '#F1CF5B',
  beet: '#8A2C49',
  plum: '#5E3B63',
  berry: '#A3324A',
  potato: '#C9A46E',
  onionSkin: '#C98652',
  garlic: '#EFE6D3',
  cabbage: '#7FA08A',
  chalk: '#F7F2E8',
} as const

export type FillName = keyof typeof FILL

/** The notebook paper the drawings are designed to sit on (the --paper token). */
export const PAPER = '#F6F0E4'
