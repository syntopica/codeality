import type { Page, Route } from 'playwright'

import type { InjectedFailure } from '@/capture/InjectedFailure.js'
import { SAFE_METHODS } from '@/capture/SAFE_METHODS.js'

/**
 * Answers every write the page sends with HTTP 500 and never lets it reach
 * the server, so an action can be made to fail on a real, even production,
 * site without changing anything there.
 */
export const failWrites = async (page: Page): Promise<InjectedFailure> => {
  let attempted = false
  const handler = async (route: Route): Promise<void> => {
    if (SAFE_METHODS.has(route.request().method())) {
      await route.fallback()
      return
    }
    attempted = true
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'INJECTED', message: 'Injected failure' },
      }),
    })
  }
  await page.route('**/*', handler)
  return {
    attempted: () => attempted,
    stop: async () => {
      await page.unroute('**/*', handler)
    },
  }
}
