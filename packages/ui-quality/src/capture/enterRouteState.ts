import type { Page } from 'playwright'

import { attemptInteraction } from '@/capture/attemptInteraction.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { scrollRoute } from '@/capture/scrollRoute.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { InteractionFailure } from '@/model/InteractionFailure.js'

/**
 * Puts the screen in the state the route asks to measure: scrolled, then
 * hovered, then focused, each optional. A focus moved by script still shows
 * `:focus-visible` in Chromium, so a focus ring is measured as a keyboard
 * user sees it.
 */
export const enterRouteState = async (
  page: Page,
  { scroll, hover, focus }: RouteConfig,
): Promise<InteractionFailure[]> => {
  const failures: InteractionFailure[] = []
  if (scroll !== null)
    failures.push(
      ...(await attemptInteraction(
        page,
        { action: 'scroll', selector: scroll },
        async () => scrollRoute(page, scroll),
      )),
    )
  if (hover !== null)
    failures.push(
      ...(await attemptInteraction(
        page,
        { action: 'hover', selector: hover },
        async () =>
          page.locator(hover).first().hover({ timeout: CLICK_TIMEOUT_MS }),
      )),
    )
  if (focus !== null)
    failures.push(
      ...(await attemptInteraction(
        page,
        { action: 'focus', selector: focus },
        async () =>
          page.locator(focus).first().focus({ timeout: CLICK_TIMEOUT_MS }),
      )),
    )
  return failures
}
