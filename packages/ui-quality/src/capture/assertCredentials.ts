import { existsSync } from 'node:fs'

import { credentialFrom } from '@/capture/credentialFrom.js'
import type { AuthConfig } from '@/config/AuthConfig.js'
import { expectConfig } from '@/config/expectConfig.js'

/**
 * Fails before the browser starts when a configured session cannot exist: a
 * form login with no credentials, or a session file that was never minted.
 * Whether a route needs either is only known once it bounces to the login page.
 */
export const assertCredentials = (
  auth: AuthConfig | null,
  statePath: string,
): void => {
  if (!auth) return
  if (auth.storageState) {
    expectConfig(
      existsSync(statePath),
      `auth.storageState ${auth.storageState} does not exist; mint the session first`,
    )
    return
  }
  credentialFrom(auth.usernameEnv)
  credentialFrom(auth.passwordEnv)
}
