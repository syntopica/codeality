import type { BrowserContextOptions } from 'playwright'

import { PHONE_DEVICE } from '@/capture/PHONE_DEVICE.js'
import type { Playwright } from '@/capture/Playwright.js'
import { expectConfig } from '@/config/expectConfig.js'

/**
 * The phone traits of Playwright's own device descriptor, without its window
 * size: the configured viewport keeps its width and height.
 */
export const phoneEmulation = (
  devices: Playwright['devices'],
): BrowserContextOptions => {
  const device = devices[PHONE_DEVICE] as (typeof devices)[string] | undefined
  expectConfig(
    device !== undefined,
    `a mobile viewport needs Playwright's "${PHONE_DEVICE}" device; upgrade playwright`,
  )
  const { userAgent, deviceScaleFactor, isMobile, hasTouch } = device
  return { userAgent, deviceScaleFactor, isMobile, hasTouch }
}
