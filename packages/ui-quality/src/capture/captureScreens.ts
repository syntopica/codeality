import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import { captureScreen } from '@/capture/captureScreen.js'
import { ensureSession } from '@/capture/ensureSession.js'
import { loadPlaywright } from '@/capture/loadPlaywright.js'
import { probeSource } from '@/capture/probeSource.js'
import { STATE_DIR } from '@/config/STATE_DIR.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'

/** Every route at every viewport in every colour scheme, one browser for the run. */
export const captureScreens = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
): Promise<CapturedScreen[]> => {
  const { chromium } = await loadPlaywright()
  const stateDir = join(root, STATE_DIR)
  const statePath = join(stateDir, 'state.json')
  const screensDir = join(stateDir, 'screens')
  mkdirSync(screensDir, { recursive: true })
  const probe = probeSource()
  const browser = await chromium.launch()
  try {
    await ensureSession(browser, config, statePath)
    const captured: CapturedScreen[] = []
    for (const colorScheme of config.colorSchemes) {
      for (const viewport of config.viewports) {
        const context = await browser.newContext({
          viewport,
          colorScheme,
          reducedMotion: 'reduce',
          ...(config.auth && existsSync(statePath)
            ? { storageState: statePath }
            : {}),
        })
        const page = await context.newPage()
        for (const route of config.routes) {
          const screen = { route: route.path, viewport, colorScheme }
          log(
            `capturing ${route.path} ${String(viewport.width)}x${String(viewport.height)} ${colorScheme}\n`,
          )
          const snapshot = await captureScreen({
            page,
            url: config.baseUrl + route.path,
            route,
            screen,
            screensDir,
            probe,
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
