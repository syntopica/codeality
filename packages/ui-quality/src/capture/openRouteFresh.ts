import type { Page } from 'playwright'

import { LAYOUT_SHIFT_TOTAL } from '@/capture/LAYOUT_SHIFT_TOTAL.js'
import { openRoute } from '@/capture/openRoute.js'
import type { RouteRequest } from '@/capture/RouteRequest.js'
import { storageInitScript } from '@/capture/storageInitScript.js'
import type { RouteConfig } from '@/config/RouteConfig.js'

/**
 * Opens a route with its `localStorage` written first and returns how far its
 * layout shifted while it loaded, read before any configured interaction
 * moves it on purpose.
 */
export const openRouteFresh = async (
  page: Page,
  route: RouteConfig,
  request: RouteRequest,
): Promise<number> => {
  if (Object.keys(route.localStorage).length > 0)
    await page.addInitScript(
      storageInitScript(request.baseUrl + route.path, route.localStorage),
    )
  await openRoute(page, route.path, request)
  return page.evaluate(LAYOUT_SHIFT_TOTAL)
}
