import type { Page } from 'playwright'

import { credentialFrom } from '@/capture/credentialFrom.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

export const login = async (
  page: Page,
  baseUrl: string,
  auth: AuthConfig,
): Promise<void> => {
  await page.goto(baseUrl + auth.loginPath, { waitUntil: 'networkidle' })
  await page
    .locator(auth.usernameSelector)
    .first()
    .fill(credentialFrom(auth.usernameEnv))
  await page
    .locator(auth.passwordSelector)
    .first()
    .fill(credentialFrom(auth.passwordEnv))
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith(auth.loginPath), {
      timeout: 30_000,
    }),
    page.locator(auth.submitSelector).first().click(),
  ])
}
