import type { Page } from 'playwright'

import { clickThrough } from '@/capture/clickThrough.js'
import { enterRouteState } from '@/capture/enterRouteState.js'
import { parkPointer } from '@/capture/parkPointer.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { InteractionFailure } from '@/model/InteractionFailure.js'

/**
 * Waits for the route's `waitFor` selector, runs its clicks, takes the
 * pointer off what it clicked, then runs the route's scroll, hover and focus,
 * returning what found no target.
 */
export const interactWithRoute = async (
  page: Page,
  route: RouteConfig,
): Promise<InteractionFailure[]> => {
  if (route.waitFor) await page.locator(route.waitFor).first().waitFor()
  const clicks = await clickThrough(page, route.click)
  await parkPointer(page)
  const states = await enterRouteState(page, route)
  return [
    ...clicks.map((selector) => ({ action: 'click' as const, selector })),
    ...states,
  ]
}
