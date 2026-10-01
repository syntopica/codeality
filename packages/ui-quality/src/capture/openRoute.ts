import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import type { Page } from 'playwright'

import { gotoSettled } from '@/capture/gotoSettled.js'
import { login } from '@/capture/login.js'
import type { RouteRequest } from '@/capture/RouteRequest.js'
import { expectConfig } from '@/config/expectConfig.js'

/**
 * Opens a route, signing in when it bounces to the login page: the bounce is
 * the only reliable sign that a route needs a session, since the first route of
 * a run may be public. The session is saved for the contexts that follow. A
 * session the project minted itself cannot be renewed here, so its bounce stops
 * the run instead of measuring the login page as the route.
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
  expectConfig(
    !auth.storageState,
    `${path} bounced to ${auth.loginPath}: the session in auth.storageState ${auth.storageState ?? ''} has expired; mint it again`,
  )
  await login(page, baseUrl, auth)
  mkdirSync(dirname(statePath), { recursive: true })
  await page.context().storageState({ path: statePath })
  await gotoSettled(page, url)
}
