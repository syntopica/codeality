import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { assertCredentials } from '@/capture/assertCredentials.js'
import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import { captureScreen } from '@/capture/captureScreen.js'
import { loadPlaywright } from '@/capture/loadPlaywright.js'
import { probeSource } from '@/capture/probeSource.js'
import { screenContextOptions } from '@/capture/screenContextOptions.js'
import { STATE_DIR } from '@/config/STATE_DIR.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'

/** Every route at every viewport in every colour scheme, one browser for the run. */
export const captureScreens = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
): Promise<CapturedScreen[]> => {
  assertCredentials(config.auth)
  const { chromium } = await loadPlaywright()
  const statePath = join(root, STATE_DIR, 'state.json')
  const screensDir = join(root, STATE_DIR, 'screens')
  mkdirSync(screensDir, { recursive: true })
  const probe = probeSource()
  const browser = await chromium.launch()
  try {
    const captured: CapturedScreen[] = []
    for (const colorScheme of config.colorSchemes) {
      for (const viewport of config.viewports) {
        const context = await browser.newContext(
          screenContextOptions(viewport, colorScheme, config.auth && statePath),
        )
        const page = await context.newPage()
        // Sort and search once per route: they behave the same at every size
        // and in both schemes, and each costs several reloads.
        const exercise = captured.length < config.routes.length
        for (const route of config.routes) {
          const screen = { route: route.path, viewport, colorScheme }
          log(
            `capturing ${route.path} ${String(viewport.width)}x${String(viewport.height)} ${colorScheme}\n`,
          )
          const snapshot = await captureScreen({
            page,
            baseUrl: config.baseUrl,
            auth: config.auth,
            statePath,
            route,
            screen,
            screensDir,
            probe,
            exercise,
            slowRequestMs: config.rules.slowRequest.maxMs,
          })
          captured.push({ route, snapshot })
        }
        await context.close()
      }
    }
    return captured
  } finally {
    await browser.close()
  }
}
