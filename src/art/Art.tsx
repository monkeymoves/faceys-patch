import type { ArtKey } from '../domain/types'

export interface ArtProps {
  name: ArtKey
  /** Rendered width and height in px. */
  size?: number
  /** Accessible name. Omit for decorative art, which is hidden from screen readers. */
  title?: string
  className?: string
}

/** Placeholder until the drawings land: a dashed circle labelled with the key. */
export function Art({ name, size = 64, title, className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-art={name}
    >
      {title && <title>{title}</title>}
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeDasharray="4 4" />
    </svg>
  )
}
