import type { Scope } from 'eslint'
import type { Expression, Identifier, Super } from 'estree'

import { constDefinition } from '@/eslint/kysely/constDefinition.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** The initializer of the `const` the identifier names directly; undefined for anything else. */
export const constInitializer = (
  identifier: Identifier,
  scope: Scope.Scope,
): Expression | Super | undefined => {
  const declarator = constDefinition(identifier, scope)?.node
  return declarator?.id.type === 'Identifier' && declarator.init
    ? unwrapped(declarator.init)
    : undefined
}
