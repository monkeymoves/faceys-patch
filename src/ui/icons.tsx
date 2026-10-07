import { GLYPHS, type Glyph, type IconName } from './glyphs'
import styles from './icons.module.css'

export type { IconName }

/*
 * Hand-drawn icons in the same ink style as the veg drawings. Strokes use
 * currentColor so icons follow the text colour. Path data is in glyphs.ts.
 */

export interface IconProps {
  name: IconName
  /** Rendered width and height in px. */
  size?: number
  /** Accessible name. Omit for decorative icons, which are hidden from screen readers. */
  title?: string
  className?: string
}

export function Icon({ name, size = 24, title, className }: IconProps) {
  const glyph: Glyph = GLYPHS[name]
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `${styles.icon} ${className}` : styles.icon}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-icon={name}
    >
      {title && <title>{title}</title>}
      <g transform={glyph.rotate ? `rotate(${glyph.rotate} 12 12)` : undefined}>
        {glyph.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
