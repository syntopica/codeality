import type { Page } from 'playwright'

import { PendingDocumentNavigations } from '@/capture/PendingDocumentNavigations.js'

import { SETTLE_TIMEOUT_MS } from '@/capture/SETTLE_TIMEOUT_MS.js'
import { settleNavigation } from '@/capture/settleNavigation.js'

/** Open a document and follow client redirects within the resource-settling cap. */
export const gotoSettled = async (page: Page, url: string): Promise<void> => {
  const navigations = new PendingDocumentNavigations(page)
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const deadline = Date.now() + SETTLE_TIMEOUT_MS
    await settleNavigation(page)
    for (const request of navigations.requests) {
      // Load-state waits can finish on the previous document while a client
      // redirect is awaiting its response. Require that pending document.
      await page.waitForURL(
        (current) => current.href.split('#')[0] === request.url().split('#')[0],
        {
          waitUntil: 'domcontentloaded',
          timeout: Math.max(1, deadline - Date.now()),
        },
      )
    }
    await page.waitForLoadState('domcontentloaded', {
      timeout: Math.max(1, deadline - Date.now()),
    })
    if (navigations.failed) throw new Error('Client document navigation failed')
  } finally {
    navigations.dispose()
  }
}
