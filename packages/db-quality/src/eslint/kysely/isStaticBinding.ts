import type { Scope } from 'eslint'
import type { Identifier } from 'estree'

import { constDefinition } from '@/eslint/kysely/constDefinition.js'
import { isLiteralArray } from '@/eslint/kysely/isLiteralArray.js'
import { isLiteralValue } from '@/eslint/kysely/isLiteralValue.js'
import { iteratedLiteralArray } from '@/eslint/kysely/iteratedLiteralArray.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/**
 * A `const` whose value is fixed in the source: bound to a literal, taken
 * directly out of a literal tuple by destructuring, or iterated by `for...of`
 * over a literal array.
 */
export const isStaticBinding = (
  identifier: Identifier,
  scope: Scope.Scope,
): boolean => {
  const definition = constDefinition(identifier, scope)
  if (!definition) return false
  const { id, init } = definition.node
  if (!init) return iteratedLiteralArray(definition, scope)
  if (id.type === 'Identifier') return isLiteralValue(unwrapped(init))
  return (
    id.type === 'ArrayPattern' &&
    id.elements.includes(definition.name) &&
    isLiteralArray(init, scope)
  )
}
