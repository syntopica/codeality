import type { ExplainSummary } from '@/bench/ExplainSummary.js'
import type { PlanNode } from '@/bench/PlanNode.js'
import { walkPlan } from '@/bench/walkPlan.js'

export const summarizeExplain = (explainJson: string): ExplainSummary => {
  const scanKinds = ['Index Scan', 'Index Only Scan', 'Bitmap Heap Scan']
  const parsed: unknown = JSON.parse(explainJson)
  const first = Array.isArray(parsed) ? (parsed[0] as unknown) : undefined
  if (
    typeof first !== 'object' ||
    first === null ||
    !('Plan' in first) ||
    !('Execution Time' in first)
  )
    throw new Error('psql output is not an EXPLAIN document')
  const document = first as { Plan: PlanNode; 'Execution Time': number }
  const seqScans: { relation: string; rows: number }[] = []
  const indexScans: string[] = []
  let worstEstimateRatio = 0
  walkPlan(document.Plan, (node) => {
    const relation = node['Relation Name']
    if (node['Node Type'] === 'Seq Scan' && relation)
      seqScans.push({
        relation,
        rows:
          (node['Actual Rows'] + (node['Rows Removed by Filter'] ?? 0)) *
          node['Actual Loops'],
      })
    if (relation && scanKinds.includes(node['Node Type']))
      indexScans.push(relation)
    const plan = node['Plan Rows']
    const actual = node['Actual Rows']
    if (plan > 0 && actual > 0) {
      const ratio = Math.max(
        (plan + 1) / (actual + 1),
        (actual + 1) / (plan + 1),
      )
      if (ratio > worstEstimateRatio) worstEstimateRatio = ratio
    }
  })
  return {
    executionMs: document['Execution Time'],
    seqScans,
    indexScans,
    worstEstimateRatio,
  }
}
