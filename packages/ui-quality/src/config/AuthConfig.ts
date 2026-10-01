/** A username and password form. The credentials come from the named environment variables. */
export type AuthConfig = {
  loginPath: string
  usernameEnv: string
  passwordEnv: string
  usernameSelector: string
  passwordSelector: string
  submitSelector: string
}
