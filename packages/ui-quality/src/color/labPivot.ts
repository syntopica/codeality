// The CIE cube-root with its linear segment near zero.
export const labPivot = (value: number): number =>
  value > 216 / 24_389 ? Math.cbrt(value) : ((24_389 / 27) * value + 16) / 116
