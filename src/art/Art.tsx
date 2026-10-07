import type { ArtKey } from '../domain/types'
import { drawings } from './drawings'

export interface ArtProps {
  name: ArtKey
  /** Rendered width and height in px. */
  size?: number
  /** Accessible name. Omit for decorative art, which is hidden from screen readers. */
  title?: string
  className?: string
}

/** A hand-drawn illustration of a crop, in the shed-notebook ink style. */
export function Art({ name, size = 64, title, className }: ArtProps) {
  const Drawing = drawings[name]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-art={name}
    >
      {title && <title>{title}</title>}
      <Drawing />
    </svg>
  )
}
