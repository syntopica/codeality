/**
 * How far each measured metric may rise over its accepted value before a
 * baselined finding counts as worse. Five captures of one build gave identical
 * values; the pixel tolerance still absorbs subpixel layout rounding, and an
 * element count is exact.
 */
export const METRIC_TOLERANCES: ReadonlyMap<string, number> = new Map([
  ['overflow-excess-px/v1', 1],
  ['affected-elements/v1', 0],
])
