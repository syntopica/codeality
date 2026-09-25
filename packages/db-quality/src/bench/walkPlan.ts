import type { PlanNode } from '@/bench/PlanNode.js'

export const walkPlan = (
  node: PlanNode,
  visit: (node: PlanNode) => void,
): void => {
  visit(node)
  for (const child of node.Plans ?? []) walkPlan(child, visit)
}
