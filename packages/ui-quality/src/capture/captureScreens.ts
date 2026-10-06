import { assertCredentials } from '@/capture/assertCredentials.js'
import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import { captureScreen } from '@/capture/captureScreen.js'
import { ensureScreensDir } from '@/capture/ensureScreensDir.js'
import { initScriptsOf } from '@/capture/initScriptsOf.js'
import { loadPlaywright } from '@/capture/loadPlaywright.js'
import { openScreenPage } from '@/capture/openScreenPage.js'
import { probeSource } from '@/capture/probeSource.js'
import { screenContextOptions } from '@/capture/screenContextOptions.js'
import { statePathOf } from '@/capture/statePathOf.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { screenLabel } from '@/model/screenLabel.js'

/** Every route at every viewport in every colour scheme, one browser for the run. */
export const captureScreens = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
): Promise<CapturedScreen[]> => {
  const statePath = statePathOf(root, config.auth)
  assertCredentials(config.auth, statePath)
  const session = config.auth && statePath
  const { chromium, devices } = await loadPlaywright()
  const screensDir = ensureScreensDir(root)
  const probe = probeSource()
  const initScripts = initScriptsOf(root, config.initScripts)
  const browser = await chromium.launch()
  try {
    const captured: CapturedScreen[] = []
    for (const colorScheme of config.colorSchemes) {
      for (const viewport of config.viewports) {
        const { context, page } = await openScreenPage(
          browser,
          screenContextOptions(viewport, colorScheme, session, devices),
          initScripts,
        )
        // Sort and search once per route: they behave the same at every size
        // and in both schemes, and each costs several reloads.
        const exercise = captured.length < config.routes.length
        for (const route of config.routes) {
          const screen = { route: route.path, viewport, colorScheme }
          log(`capturing ${route.path} ${screenLabel(screen)}\n`)
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
            axe: config.axe,
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
