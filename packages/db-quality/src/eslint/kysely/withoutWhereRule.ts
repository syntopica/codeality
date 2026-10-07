import type { Rule } from 'eslint'

import { isUnguardedWrite } from '@/eslint/kysely/isUnguardedWrite.js'
import { OBJECT_NAMES_SCHEMA } from '@/eslint/kysely/OBJECT_NAMES_SCHEMA.js'
import { ruleObjectNames } from '@/eslint/kysely/ruleObjectNames.js'

/** A rule reporting a `<rootMethod>` chain that reaches execute with no where. */
export const withoutWhereRule = (
  rootMethod: string,
  message: string,
): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: { description: `Require a where on every ${rootMethod} chain.` },
    schema: OBJECT_NAMES_SCHEMA,
    messages: { withoutWhere: message },
  },
  create(context) {
    const objectNames = ruleObjectNames(context)
    return {
      CallExpression(node) {
        if (isUnguardedWrite(node, rootMethod, objectNames))
          context.report({ node, messageId: 'withoutWhere' })
      },
    }
  },
})
