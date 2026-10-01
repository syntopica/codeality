import type { Page } from 'playwright'

import { NEXT_PAGE_NAME } from '@/capture/NEXT_PAGE_NAME.js'

/** Whether the main region shows a "next page" control, enabled or not. */
export const hasPageControl = async (
  page: Page,
  main: string,
): Promise<boolean> => {
  const region = page.locator(main)
  return await region
    .getByRole('button', { name: NEXT_PAGE_NAME })
    .or(region.getByRole('link', { name: NEXT_PAGE_NAME }))
    .first()
    .isVisible()
}
