/**
 * A measured value recorded with a baseline entry. `metric` is a versioned,
 * tool-defined unit where a higher value is worse; `context` is where it was
 * measured (a UI screen), so a value is only compared with one taken at the
 * same place.
 */
export type BaselineMeasurement = {
  metric: string
  context: string
  observed: number
}
