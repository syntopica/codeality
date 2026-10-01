import { existsSync } from 'node:fs'

import type { BrowserContextOptions } from 'playwright'

import type { ColorScheme } from '@/model/ColorScheme.js'
import type { Viewport } from '@/model/Viewport.js'

/**
 * A browser context for one viewport and scheme, with motion reduced and the
 * saved session reused once a login has written it.
 */
export const screenContextOptions = (
  viewport: Viewport,
  colorScheme: ColorScheme,
  statePath: string | null | undefined,
): BrowserContextOptions => ({
  viewport,
  colorScheme,
  reducedMotion: 'reduce',
  ...(statePath && existsSync(statePath) ? { storageState: statePath } : {}),
})
