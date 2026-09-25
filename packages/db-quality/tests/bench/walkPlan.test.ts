import { describe, expect, it } from 'vitest'

import type { PlanNode } from '@/bench/PlanNode.js'
import { walkPlan } from '@/bench/walkPlan.js'

describe('walkPlan', () => {
  it('visits a node before recursing into its children, depth-first', () => {
    const leaf = (name: string): PlanNode => ({
      'Node Type': name,
      'Plan Rows': 1,
      'Actual Rows': 1,
      'Actual Loops': 1,
    })
    const root: PlanNode = {
      ...leaf('Nested Loop'),
      Plans: [leaf('Seq Scan'), leaf('Index Scan')],
    }
    const visited: string[] = []
    walkPlan(root, (node) => visited.push(node['Node Type']))
    expect(visited).toEqual(['Nested Loop', 'Seq Scan', 'Index Scan'])
  })
})
