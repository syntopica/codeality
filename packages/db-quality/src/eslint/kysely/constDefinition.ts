import type { Scope } from 'eslint'
import type { Identifier } from 'estree'

import type { ConstVariableDefinition } from '@/eslint/kysely/ConstVariableDefinition.js'

/** The single `const` definition the identifier refers to; undefined for anything else. */
export const constDefinition = (
  identifier: Identifier,
  scope: Scope.Scope,
): ConstVariableDefinition | undefined => {
  let current: Scope.Scope | null = scope
  while (current) {
    const variable = current.set.get(identifier.name)
    if (variable) {
      const definition = variable.defs[0]
      return variable.defs.length === 1 &&
        definition?.type === 'Variable' &&
        definition.parent.kind === 'const'
        ? definition
        : undefined
    }
    current = current.upper
  }
  return undefined
}
