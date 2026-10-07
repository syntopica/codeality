/**
 * Sums the page's layout shifts from its first byte, before its own scripts
 * run: a buffered observer created later, from the probe, saw no entries in
 * headless Chromium. Shifts within 500ms of input are the user's doing and
 * are left out, as the CLS metric does. A browser without the entry type
 * keeps the total at 0. Reading the total first takes the entries the
 * observer has queued but not yet delivered: its callback runs on a later
 * task, and on a loaded machine a read straight after the network settled
 * came before it and missed the shift.
 */
export const LAYOUT_SHIFT_INIT_SCRIPT = `(() => {
  let total = 0
  let observer
  const add = (entries) => {
    for (const entry of entries)
      if (!entry.hadRecentInput) total += entry.value
  }
  try {
    observer = new PerformanceObserver((list) => add(list.getEntries()))
    observer.observe({ type: 'layout-shift', buffered: true })
  } catch {}
  Object.defineProperty(window, '__codealityLayoutShift', {
    get: () => {
      if (observer) add(observer.takeRecords())
      return total
    },
    configurable: true,
  })
})()`
