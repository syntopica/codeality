/** The distance between the largest and the smallest value. */
export const spreadOf = (values: number[]): number =>
  Math.max(...values) - Math.min(...values)
