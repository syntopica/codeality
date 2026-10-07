import type { Scope } from 'eslint'
import type { Expression, SpreadElement } from 'estree'

import { constInitializer } from '@/eslint/kysely/constInitializer.js'
import { isLiteralCollection } from '@/eslint/kysely/isLiteralCollection.js'
import { isLiteralValue } from '@/eslint/kysely/isLiteralValue.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** A literal, a `const` bound to one, or a member of a `const` literal collection. */
export const isStaticSqlArgument = (
  argument: Expression | SpreadElement,
  scope: Scope.Scope,
): boolean => {
  if (argument.type === 'SpreadElement') return false
  const node = unwrapped(argument)
  if (isLiteralValue(node)) return true
  if (node.type === 'Identifier') {
    const init = constInitializer(node, scope)
    return init !== undefined && isLiteralValue(init)
  }
  if (node.type !== 'MemberExpression') return false
  const object = unwrapped(node.object)
  if (object.type !== 'Identifier') return false
  const init = constInitializer(object, scope)
  return init !== undefined && isLiteralCollection(init)
}
