import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import type { Browser } from 'playwright'

import { login } from '@/capture/login.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'

// Reuses the cached session while it still opens the first route; logs in
// again and rewrites the cache when the route bounces to the login page.
export const ensureSession = async (
  browser: Browser,
  config: UiQualityConfig,
  statePath: string,
): Promise<void> => {
  const { auth } = config
  if (!auth) return
  const context = await browser.newContext(
    existsSync(statePath) ? { storageState: statePath } : {},
  )
  try {
    const page = await context.newPage()
    await page.goto(config.baseUrl + (config.routes[0]?.path ?? '/'), {
      waitUntil: 'networkidle',
    })
    if (!new URL(page.url()).pathname.endsWith(auth.loginPath)) return
    await login(page, config.baseUrl, auth)
    mkdirSync(dirname(statePath), { recursive: true })
    await context.storageState({ path: statePath })
  } finally {
    await context.close()
  }
}
