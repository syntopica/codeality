import type { Page } from 'playwright'

import { dialogIsOpen } from '@/capture/dialogIsOpen.js'
import { settlePage } from '@/capture/settlePage.js'

/** Does `act`, lets the page settle, and says whether the dialog still shows. */
export const stillOpenAfter = async (
  page: Page,
  act: () => Promise<void>,
): Promise<boolean> => {
  await act()
  await settlePage(page)
  return dialogIsOpen(page)
}
