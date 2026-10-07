import type { ElementBox } from '@/model/ElementBox.js'
import type { Rule } from '@/rules/Rule.js'
import type { RuleContext } from '@/rules/RuleContext.js'

import { ruleContext } from './ruleContext.js'
import { snapshotOf } from './snapshotOf.js'

/** The subjects a rule reports over these boxes, in order. */
export const subjectsOf = (
  rule: Rule,
  boxes: ElementBox[],
  context: Partial<RuleContext> = {},
): string[] =>
  rule(snapshotOf(boxes), ruleContext(context)).map(
    (finding) => finding.subject,
  )
