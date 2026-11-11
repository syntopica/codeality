import type { Page } from 'playwright'

import { firstInSelectorOrder } from '@/capture/firstInSelectorOrder.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

/**
 * Whether the page shows the sign-in form itself. A single-page app can render
 * it in place at any address, so the address never bounces to the login path.
 */
export const hasVisibleLoginForm = async (
  page: Page,
  auth: AuthConfig,
): Promise<boolean> =>
  (await firstInSelectorOrder(page, auth.passwordSelector)).isVisible()
