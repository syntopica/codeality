import type { Rule } from 'eslint'

import type { ChainRuleOptions } from '@/eslint/kysely/ChainRuleOptions.js'
import { DEFAULT_OBJECT_NAMES } from '@/eslint/kysely/DEFAULT_OBJECT_NAMES.js'

/** The `objectNames` option of a chain rule, or Kysely's defaults. */
export const ruleObjectNames = (
  context: Rule.RuleContext,
): readonly string[] => {
  const option = context.options[0] as ChainRuleOptions | undefined
  return option?.objectNames ?? DEFAULT_OBJECT_NAMES
}
