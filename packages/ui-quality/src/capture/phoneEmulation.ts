import type { BrowserContextOptions } from 'playwright'

import { PHONE_DEVICE } from '@/capture/PHONE_DEVICE.js'
import type { Playwright } from '@/capture/Playwright.js'

/**
 * The phone traits of Playwright's own device descriptor, without its window
 * size: the configured viewport keeps its width and height.
 */
export const phoneEmulation = (
  devices: Playwright['devices'],
): BrowserContextOptions => {
  const { userAgent, deviceScaleFactor, isMobile, hasTouch } =
    devices[PHONE_DEVICE]
  return { userAgent, deviceScaleFactor, isMobile, hasTouch }
}
