import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import type { Page } from 'playwright'

import { gotoSettled } from '@/capture/gotoSettled.js'
import { login } from '@/capture/login.js'
import type { RouteRequest } from '@/capture/RouteRequest.js'

/**
 * Opens a route, signing in when it bounces to the login page: the bounce is
 * the only reliable sign that a route needs a session, since the first route of
 * a run may be public. The session is saved for the contexts that follow.
 */
export const openRoute = async (
  page: Page,
  path: string,
  { baseUrl, auth, statePath }: RouteRequest,
): Promise<void> => {
  const url = baseUrl + path
  await gotoSettled(page, url)
  if (!auth || path.endsWith(auth.loginPath)) return
  if (!new URL(page.url()).pathname.endsWith(auth.loginPath)) return
  await login(page, baseUrl, auth)
  mkdirSync(dirname(statePath), { recursive: true })
  await page.context().storageState({ path: statePath })
  await gotoSettled(page, url)
}
