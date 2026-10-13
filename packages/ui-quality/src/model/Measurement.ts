/**
 * A number a rule measured, kept beside the message so a gate can compare it
 * without parsing text. `metric` names the unit and is versioned
 * (`overflow-excess-px/v1`); a higher `observed` is always worse. `threshold`
 * is the limit the rule applied, when it has one.
 */
export type Measurement = {
  metric: string
  observed: number
  threshold?: number
}
