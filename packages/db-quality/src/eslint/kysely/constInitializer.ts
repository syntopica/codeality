import type { Scope } from 'eslint'
import type { Expression, Identifier, Super } from 'estree'

import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** The initializer of the `const` the identifier refers to; undefined for anything else. */
export const constInitializer = (
  identifier: Identifier,
  scope: Scope.Scope,
): Expression | Super | undefined => {
  let current: Scope.Scope | null = scope
  while (current) {
    const variable = current.set.get(identifier.name)
    if (variable) {
      const definition = variable.defs[0]
      if (
        variable.defs.length !== 1 ||
        definition?.type !== 'Variable' ||
        definition.parent.kind !== 'const' ||
        !definition.node.init
      )
        return undefined
      return unwrapped(definition.node.init)
    }
    current = current.upper
  }
  return undefined
}
