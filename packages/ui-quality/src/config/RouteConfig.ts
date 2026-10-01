export type RouteConfig = {
  path: string
  /** The main content region; `main` when omitted. */
  main: string
  /** A selector that must be visible before the screen is measured. */
  waitFor: string | null
}
