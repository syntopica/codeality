export type PlanNode = {
  'Node Type': string
  'Relation Name'?: string
  'Plan Rows': number
  'Actual Rows': number
  'Actual Loops': number
  'Rows Removed by Filter'?: number
  Plans?: PlanNode[]
}
