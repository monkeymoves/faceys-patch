import { CROP_ACTIVITIES, formatMonths, type CropActivity, type CropYear } from '../../domain'
import type { MonthStripRow } from '../../ui/MonthStrip'

/** What each row of a crop's year is called. Shared by the Grow screen and the Patch's crop sheet. */
export const ACTIVITY_LABELS: Record<CropActivity, string> = {
  sowIndoors: 'Sow under cover',
  sowOutdoors: 'Sow outside',
  plantOut: 'Plant',
  harvest: 'Harvest',
}

/** Rows for a MonthStrip, in the order things happen. The strip skips rows with no months. */
export function stripRows(year: CropYear): MonthStripRow[] {
  return CROP_ACTIVITIES.map((activity) => ({
    tone: activity,
    label: ACTIVITY_LABELS[activity],
    months: year[activity],
    spoken: formatMonths(year[activity]),
  }))
}
