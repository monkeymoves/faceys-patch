import { Sheet } from '../../ui/Sheet'

export interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

/** Placeholder until the screen is built. */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <p>Coming soon.</p>
    </Sheet>
  )
}
