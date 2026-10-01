import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { RawFinding } from '@/model/RawFinding.js'
import type { RuleContext } from '@/rules/RuleContext.js'

export type Rule = (
  snapshot: PageSnapshot,
  context: RuleContext,
) => RawFinding[]
