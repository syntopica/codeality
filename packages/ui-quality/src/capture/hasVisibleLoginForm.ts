import type { Page } from 'playwright'

import { firstInSelectorOrder } from '@/capture/firstInSelectorOrder.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

/**
 * Whether the page shows the sign-in form itself. A single-page app can render
 * it in place at any address, so the address never bounces to the login path.
 * A password field alone is not one: a signed-in account page that changes
 * the password has one and no username field, and filling it as a login timed
 * out the whole route.
 */
export const hasVisibleLoginForm = async (
  page: Page,
  auth: AuthConfig,
): Promise<boolean> =>
  (await (
    await firstInSelectorOrder(page, auth.passwordSelector)
  ).isVisible()) &&
  (await (await firstInSelectorOrder(page, auth.usernameSelector)).isVisible())
