import { existsSync } from 'node:fs'

import type { BrowserContextOptions } from 'playwright'

import { phoneEmulation } from '@/capture/phoneEmulation.js'
import type { Playwright } from '@/capture/Playwright.js'
import type { ColorScheme } from '@/model/ColorScheme.js'
import type { Viewport } from '@/model/Viewport.js'

/**
 * A browser context for one viewport and scheme, with motion reduced and the
 * saved session reused once a login has written it. A `mobile` viewport also
 * gets a phone's touch, pixel density and user agent.
 */
export const screenContextOptions = (
  viewport: Viewport,
  colorScheme: ColorScheme,
  statePath: string | null | undefined,
  devices: Playwright['devices'],
): BrowserContextOptions => ({
  viewport: { width: viewport.width, height: viewport.height },
  ...(viewport.mobile ? phoneEmulation(devices) : {}),
  colorScheme,
  reducedMotion: 'reduce',
  ...(statePath && existsSync(statePath) ? { storageState: statePath } : {}),
})
