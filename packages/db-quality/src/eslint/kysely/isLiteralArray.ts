import type { Scope } from 'eslint'
import type { Expression, Super } from 'estree'

import { constInitializer } from '@/eslint/kysely/constInitializer.js'
import { isLiteralCollection } from '@/eslint/kysely/isLiteralCollection.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** An array literal of literals, or a `const` bound to one, so every element of it is a literal. */
export const isLiteralArray = (
  node: Expression | Super,
  scope: Scope.Scope,
): boolean => {
  const expression = unwrapped(node)
  const array =
    expression.type === 'Identifier'
      ? constInitializer(expression, scope)
      : expression
  return array?.type === 'ArrayExpression' && isLiteralCollection(array)
}
