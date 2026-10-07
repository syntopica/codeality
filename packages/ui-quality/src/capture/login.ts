import { gotoSettled } from '@/capture/gotoSettled.js'
import type { Page } from 'playwright'

import { credentialFrom } from '@/capture/credentialFrom.js'
import { firstInSelectorOrder } from '@/capture/firstInSelectorOrder.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

export const login = async (
  page: Page,
  baseUrl: string,
  auth: AuthConfig,
): Promise<void> => {
  await gotoSettled(page, baseUrl + auth.loginPath)
  await (
    await firstInSelectorOrder(page, auth.usernameSelector)
  ).fill(credentialFrom(auth.usernameEnv))
  await (
    await firstInSelectorOrder(page, auth.passwordSelector)
  ).fill(credentialFrom(auth.passwordEnv))
  const submit = await firstInSelectorOrder(page, auth.submitSelector)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith(auth.loginPath), {
      timeout: 30_000,
    }),
    submit.click(),
  ])
}
