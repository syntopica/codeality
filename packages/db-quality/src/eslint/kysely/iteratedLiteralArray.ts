import type { Rule, Scope } from 'eslint'

import type { ConstVariableDefinition } from '@/eslint/kysely/ConstVariableDefinition.js'
import { isLiteralArray } from '@/eslint/kysely/isLiteralArray.js'

/** True for the `t` of `for (const t of ['a', 'b'])`, or of a `const` bound to such an array. */
export const iteratedLiteralArray = (
  definition: ConstVariableDefinition,
  scope: Scope.Scope,
): boolean => {
  const loop = (definition.parent as Rule.Node).parent
  return (
    definition.node.id.type === 'Identifier' &&
    loop?.type === 'ForOfStatement' &&
    loop.left === definition.parent &&
    isLiteralArray(loop.right, scope)
  )
}
