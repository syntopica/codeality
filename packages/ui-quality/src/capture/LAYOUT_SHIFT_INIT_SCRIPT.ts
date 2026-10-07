/**
 * Sums the page's layout shifts from its first byte, before its own scripts
 * run: a buffered observer created later, from the probe, saw no entries in
 * headless Chromium. Shifts within 500ms of input are the user's doing and
 * are left out, as the CLS metric does. A browser without the entry type
 * keeps the total at 0.
 */
export const LAYOUT_SHIFT_INIT_SCRIPT = `(() => {
  let total = 0
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) total += entry.value
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {}
  Object.defineProperty(window, '__codealityLayoutShift', {
    get: () => total,
    configurable: true,
  })
})()`
