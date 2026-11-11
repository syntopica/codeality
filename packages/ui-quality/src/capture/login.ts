import type { Page } from 'playwright'

import { gotoSettled } from '@/capture/gotoSettled.js'
import { submitLogin } from '@/capture/submitLogin.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

export const login = async (
  page: Page,
  baseUrl: string,
  auth: AuthConfig,
): Promise<void> => {
  await gotoSettled(page, baseUrl + auth.loginPath)
  await submitLogin(page, auth)
}
