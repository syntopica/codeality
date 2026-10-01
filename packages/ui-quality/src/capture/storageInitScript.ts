/**
 * A script that writes a route's `localStorage` entries before the page's own
 * scripts run. It checks the URL because an init script stays on the page for
 * every later navigation, and each route must see only its own entries.
 */
export const storageInitScript = (
  url: string,
  entries: Record<string, string>,
): string =>
  `if (location.href === ${JSON.stringify(url)}) {` +
  `for (const [key, value] of Object.entries(${JSON.stringify(entries)})) localStorage.setItem(key, value)` +
  `}`
