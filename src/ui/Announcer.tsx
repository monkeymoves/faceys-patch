export interface AnnouncerProps {
  /** From useAnnouncer(). Each new message is read out once, politely. */
  message: string
}

/**
 * An always-present, invisible polite live region. Screen readers only notice
 * a live region that was already on the page when its text changes, so render
 * this from the start and fill it with useAnnouncer(). Inside a sheet, render
 * one inside the sheet: anything behind an open modal is not read out.
 */
export function Announcer({ message }: AnnouncerProps) {
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
      {message}
    </p>
  )
}
