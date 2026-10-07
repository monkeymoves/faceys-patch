/*
 * Decorative pen marks shared by several components: the ring around the active
 * tab, the ring round today's date, the underline under screen titles, and the
 * tick box. All hidden from assistive tech. Wobble is baked into the paths.
 */

interface MarkProps {
  className?: string
}

/** A pencil loop drawn round something, overshooting where it started. 56x40. */
export function RingMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 56 40" fill="none" aria-hidden="true" focusable="false">
      <path
        pathLength={1}
        d="M8.7 11.5C10.4 10.4 14.8 6.3 18.6 5C22.5 3.8 27.8 3.6 31.9 4.2C35.9 4.7 39.8 6.4 42.9 8.3C46 10.1 48.9 12.4 50.4 15.1C51.8 17.8 52.8 21.5 51.7 24.4C50.6 27.3 47.3 30.6 43.9 32.6C40.4 34.5 35.3 35.7 31 36.2C26.6 36.6 21.7 36.3 17.8 35.1C13.9 34 9.8 31.9 7.4 29.5C5.1 27.1 3.6 23.6 3.5 20.6C3.4 17.5 4.5 13.9 6.8 11.1C9.1 8.3 15.6 5.2 17.4 4"
      />
    </svg>
  )
}

/** A flat wash shape that sits a little off-register behind a ring. 56x40. */
export function BlobMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 56 40" aria-hidden="true" focusable="false">
      <path d="M49.7 21.5C50.2 24 49.2 27.7 46.9 29.7C44.6 31.8 39.6 33.3 35.7 33.9C31.8 34.5 27.3 34.2 23.6 33.4C19.9 32.6 15.8 31 13.5 29C11.2 27.1 9.8 24.1 9.7 21.5C9.6 18.9 10.8 15.9 13 13.7C15.2 11.5 19.2 9.1 23 8.4C26.7 7.7 32 8.4 35.6 9.4C39.1 10.4 42 12.5 44.3 14.5C46.7 16.5 49.3 19 49.7 21.5Z" />
    </svg>
  )
}

/** A rounder loop for circling a date. 48x48. */
export function DateRingMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path
        pathLength={1}
        d="M12.6 9.2C14.5 8.8 20.3 6.6 23.8 6.8C27.4 7.1 31.2 8.7 34.1 10.6C37 12.6 40.1 15.4 41.4 18.6C42.8 21.7 43.2 26.1 42.2 29.5C41.2 32.8 38.6 36.5 35.6 38.7C32.6 40.8 28.1 42.5 24.4 42.5C20.7 42.5 16.2 40.8 13.3 38.6C10.3 36.5 8 33 6.6 29.7C5.3 26.3 4.2 22.1 5 18.5C5.7 14.9 8.1 10.4 11.1 8.2C14.2 5.9 21.3 5.6 23.3 5.1"
      />
    </svg>
  )
}

/** A long, slightly uneven pen stroke. Stretches to any width; the line keeps its weight. */
export function UnderlineMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        vectorEffect="non-scaling-stroke"
        d="M3 7.6C22 6.4 48 5.6 76 5.9C104 6.2 128 7.4 152 7.1C170 6.9 186 5.6 197 4.2"
      />
    </svg>
  )
}

/** A hand-drawn tick box with the tick that overshoots it. 24x24. */
export function TickBoxMark({ className, tickClassName }: MarkProps & { tickClassName?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M4.4 4.6C9.4 4.2 14.6 4.3 19.6 4.5C19.9 9.5 19.8 14.6 19.6 19.5C14.6 19.8 9.5 19.8 4.5 19.6C4.2 14.6 4.1 9.5 4.5 4.2" />
      <path
        className={tickClassName}
        pathLength={1}
        d="M7.3 12.4C8.7 13.6 10 15.1 11.1 16.8C13.7 12.2 17.2 7.9 21.6 4.2"
      />
    </svg>
  )
}

/** The small loop or tick that leads a toggle chip. 24x24. */
export function ChipMark({ on, className }: MarkProps & { on: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {on ? (
        <path pathLength={1} d="M4.8 12.8C6.4 14.2 7.9 15.9 9.3 17.8C12.1 13.1 15.6 8.9 20 5.2" />
      ) : (
        <path d="M8.4 6.9C9.5 6.4 12.3 5.6 14 6.2C15.7 6.8 17.4 8.6 17.8 10.3C18.2 12 17.6 14.5 16.4 15.9C15.2 17.3 12.6 18.2 10.8 18C9 17.8 7.1 16.5 6.4 14.9C5.6 13.3 5.9 10.6 6.8 9C7.7 7.4 10.6 6 11.6 5.6" />
      )}
    </svg>
  )
}
