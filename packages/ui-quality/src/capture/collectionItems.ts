import type { Page } from 'playwright'

import { COLLECTION_ITEMS } from '@/capture/COLLECTION_ITEMS.js'

/**
 * The identities of the main region's repeated items, or none while the page
 * is between documents and cannot be read.
 */
export const collectionItems = async (
  page: Page,
  main: string,
): Promise<string[]> =>
  await page
    .evaluate(`(${COLLECTION_ITEMS})(${JSON.stringify(main)})`)
    .then((items) => (Array.isArray(items) ? items.map(String) : []))
    .catch(() => [])
