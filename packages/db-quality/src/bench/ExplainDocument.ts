import type { PlanNode } from '@/bench/PlanNode.js'

/** The first element of an `EXPLAIN (ANALYZE, FORMAT JSON)` result. */
export type ExplainDocument = { Plan: PlanNode; 'Execution Time': number }
