import type AxeBuilder from '@axe-core/playwright'

import type { AxeViolation } from '@/model/AxeViolation.js'

export const axeViolationsOf = (
  results: Awaited<ReturnType<AxeBuilder['analyze']>>,
): AxeViolation[] =>
  results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target.join(' '),
      summary: (node.failureSummary ?? '').replaceAll(/\s+/g, ' ').trim(),
    })),
  }))
