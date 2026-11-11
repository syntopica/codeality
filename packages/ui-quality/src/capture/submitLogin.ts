import type { Page } from 'playwright'

import { credentialFrom } from '@/capture/credentialFrom.js'
import { firstInSelectorOrder } from '@/capture/firstInSelectorOrder.js'
import { settleNavigation } from '@/capture/settleNavigation.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

/**
 * Fills and submits the sign-in form on the current page, then waits for the
 * password field to go. Waiting for the address to change hung on an app that
 * swaps the form for the workspace without navigating.
 */
export const submitLogin = async (
  page: Page,
  auth: AuthConfig,
): Promise<void> => {
  await (
    await firstInSelectorOrder(page, auth.usernameSelector)
  ).fill(credentialFrom(auth.usernameEnv))
  const password = await firstInSelectorOrder(page, auth.passwordSelector)
  await password.fill(credentialFrom(auth.passwordEnv))
  const submit = await firstInSelectorOrder(page, auth.submitSelector)
  await submit.click({ noWaitAfter: true })
  await password.waitFor({ state: 'hidden', timeout: 30_000 })
  await settleNavigation(page)
}
