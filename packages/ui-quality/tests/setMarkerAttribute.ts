import type { Page } from 'playwright'

import { PRIMARY_MARKER_SELECTOR } from './PRIMARY_MARKER_SELECTOR.js'

/** Keep browser DOM code serialized: the package type-checks against Node libraries. */
export const setMarkerAttribute = async (
  page: Page,
  name: string,
  value: string | null,
): Promise<void> => {
  await page.evaluate(`(() => {
    const marker = document.querySelector(${JSON.stringify(PRIMARY_MARKER_SELECTOR)})
    if (marker === null) throw new Error('Expected fixture primary marker')
    const change = ${JSON.stringify({ name, value })}
    if (change.value === null) marker.removeAttribute(change.name)
    else marker.setAttribute(change.name, change.value)
  })()`)
}
