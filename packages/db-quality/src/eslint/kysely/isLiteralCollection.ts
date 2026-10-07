import type { Expression, Super } from 'estree'

import { isLiteralValue } from '@/eslint/kysely/isLiteralValue.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** An object or array literal whose every value is a literal, so any member of it is one. */
export const isLiteralCollection = (node: Expression | Super): boolean => {
  if (node.type === 'ArrayExpression')
    return node.elements.every(
      (element) =>
        element !== null &&
        element.type !== 'SpreadElement' &&
        isLiteralValue(unwrapped(element)),
    )
  return (
    node.type === 'ObjectExpression' &&
    node.properties.every(
      (property) =>
        property.type === 'Property' &&
        property.value.type !== 'ObjectPattern' &&
        property.value.type !== 'ArrayPattern' &&
        property.value.type !== 'RestElement' &&
        property.value.type !== 'AssignmentPattern' &&
        isLiteralValue(unwrapped(property.value)),
    )
  )
}
