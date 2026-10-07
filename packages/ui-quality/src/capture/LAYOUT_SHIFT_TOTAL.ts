/** Reads what `LAYOUT_SHIFT_INIT_SCRIPT` summed, 0 when it did not run. */
export const LAYOUT_SHIFT_TOTAL =
  'Math.round((window.__codealityLayoutShift ?? 0) * 1000) / 1000'
