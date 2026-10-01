/**
 * How a run gets a session. Either a username and password form, whose
 * credentials come from the named environment variables, or a Playwright
 * storageState file the project mints itself (a magic link, SSO), used as is.
 */
export type AuthConfig = {
  loginPath: string
  usernameEnv: string
  passwordEnv: string
  usernameSelector: string
  passwordSelector: string
  submitSelector: string
  storageState: string | null
}
