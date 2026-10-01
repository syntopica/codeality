import { credentialFrom } from '@/capture/credentialFrom.js'
import type { AuthConfig } from '@/config/AuthConfig.js'

/**
 * Fails before the browser starts when a configured login has no credentials:
 * whether a route needs them is only known once it bounces to the login page.
 */
export const assertCredentials = (auth: AuthConfig | null): void => {
  if (!auth) return
  credentialFrom(auth.usernameEnv)
  credentialFrom(auth.passwordEnv)
}
