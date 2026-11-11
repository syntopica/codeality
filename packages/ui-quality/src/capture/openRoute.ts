import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import type { Page } from 'playwright'

import { gotoSettled } from '@/capture/gotoSettled.js'
import { hasVisibleLoginForm } from '@/capture/hasVisibleLoginForm.js'
import { login } from '@/capture/login.js'
import type { RouteRequest } from '@/capture/RouteRequest.js'
import { samePathname } from '@/capture/samePathname.js'
import { submitLogin } from '@/capture/submitLogin.js'
import { expectConfig } from '@/config/expectConfig.js'

/**
 * Opens a route, signing in when it bounces to the login page or shows the
 * sign-in form in place: either is the only reliable sign that a route needs a
 * session, since the first route of a run may be public. The session is saved
 * for the contexts that follow. A session the project minted itself cannot be
 * renewed here, so its bounce stops the run instead of measuring the login page
 * as the route.
 */
export const openRoute = async (
  page: Page,
  path: string,
  { baseUrl, auth, statePath }: RouteRequest,
): Promise<void> => {
  const url = baseUrl + path
  await gotoSettled(page, url)
  if (!auth) return
  const loginUrl = baseUrl + auth.loginPath
  if (samePathname(url, loginUrl)) return
  const bounced = samePathname(page.url(), loginUrl)
  if (!bounced && !(await hasVisibleLoginForm(page, auth))) return
  expectConfig(
    !auth.storageState,
    `${path} asked for a sign-in: the session in auth.storageState ${auth.storageState ?? ''} has expired; mint it again`,
  )
  if (bounced) await login(page, baseUrl, auth)
  else await submitLogin(page, auth)
  mkdirSync(dirname(statePath), { recursive: true })
  await page.context().storageState({ path: statePath })
  await gotoSettled(page, url)
}
