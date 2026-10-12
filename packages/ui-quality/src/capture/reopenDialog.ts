import type { Page } from 'playwright'

import { clickThrough } from '@/capture/clickThrough.js'
import { dialogIsOpen } from '@/capture/dialogIsOpen.js'

/** Replays the route's clicks to open the dialog again; whether it shows afterwards. */
export const reopenDialog = async (
  page: Page,
  clicks: string[],
): Promise<boolean> => {
  if (clicks.length === 0) return false
  await clickThrough(page, clicks)
  return dialogIsOpen(page)
}
