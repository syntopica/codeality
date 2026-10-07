export type RouteConfig = {
  path: string
  /** The main content region; `main` when omitted. */
  main: string
  /** A selector that must be visible before the screen is measured. */
  waitFor: string | null
  /**
   * Entries written to `localStorage` before the route's scripts run, for an
   * app that keeps the current view in client state rather than in its URL.
   */
  localStorage: Record<string, string>
  /**
   * Playwright selectors clicked in order once the route has loaded, to reach a
   * tab, drawer or dialog that only exists after an interaction.
   */
  click: string[]
  /**
   * Scrolled to after the clicks: `bottom` for the end of the page, else a
   * Playwright selector scrolled into view. Measures what appears on scroll,
   * such as a sticky call to action.
   */
  scroll: string | null
  /** A Playwright selector hovered before measuring, to see its hover state. */
  hover: string | null
  /** A Playwright selector focused before measuring, to see its focus state. */
  focus: string | null
}
