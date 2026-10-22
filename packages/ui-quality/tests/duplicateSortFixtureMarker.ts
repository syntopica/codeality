import type { Page } from 'playwright'

import { PRIMARY_MARKER_SELECTOR } from './PRIMARY_MARKER_SELECTOR.js'

/** Add a second declaration without importing DOM types into the Node test program. */
export const duplicateSortFixtureMarker = async (page: Page): Promise<void> => {
  await page.evaluate(`(() => {
    const marker = document.querySelector(${JSON.stringify(PRIMARY_MARKER_SELECTOR)})
    const parent = marker?.parentElement
    if (!marker || !parent) throw new Error('Expected fixture primary marker parent')
    parent.append(marker.cloneNode(true))
  })()`)
}
