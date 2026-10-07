import { assertCredentials } from '@/capture/assertCredentials.js'
import type { CaptureRun } from '@/capture/CaptureRun.js'
import { captureWithRetry } from '@/capture/captureWithRetry.js'
import { ensureScreensDir } from '@/capture/ensureScreensDir.js'
import { initScriptsOf } from '@/capture/initScriptsOf.js'
import { loadPlaywright } from '@/capture/loadPlaywright.js'
import { openScreenPage } from '@/capture/openScreenPage.js'
import { probeSource } from '@/capture/probeSource.js'
import { recordCapture } from '@/capture/recordCapture.js'
import { screenContextOptions } from '@/capture/screenContextOptions.js'
import { statePathOf } from '@/capture/statePathOf.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { screenLabel } from '@/model/screenLabel.js'

/**
 * Every route at every viewport in every colour scheme, one browser for the
 * run. A screen that fails twice is recorded and the run carries on. A run of
 * selected routes skips the up-front session check: a public route never
 * needs one, and a route that bounces to the login page still fails there.
 */
export const captureScreens = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
  assertSession = true,
): Promise<CaptureRun> => {
  const statePath = statePathOf(root, config.auth)
  if (assertSession) assertCredentials(config.auth, statePath)
  const session = config.auth && statePath
  const { chromium, devices } = await loadPlaywright()
  const screensDir = ensureScreensDir(root)
  const probe = probeSource()
  const initScripts = initScriptsOf(root, config.initScripts)
  const browser = await chromium.launch()
  try {
    const run: CaptureRun = { captured: [], failed: [] }
    for (const [schemeIndex, colorScheme] of config.colorSchemes.entries()) {
      for (const [viewportIndex, viewport] of config.viewports.entries()) {
        const { context, page } = await openScreenPage(
          browser,
          screenContextOptions(viewport, colorScheme, session, devices),
          initScripts,
        )
        // Sort and search once per route: they behave the same at every size
        // and in both schemes, and each costs several reloads.
        const exercise = schemeIndex === 0 && viewportIndex === 0
        for (const route of config.routes) {
          const screen = { route: route.path, viewport, colorScheme }
          log(`capturing ${route.path} ${screenLabel(screen)}\n`)
          const outcome = await captureWithRetry({
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
            axe: config.axe,
          })
          recordCapture(run, route, screen, outcome)
        }
        await context.close()
      }
    }
    return run
  } finally {
    await browser.close()
  }
}
