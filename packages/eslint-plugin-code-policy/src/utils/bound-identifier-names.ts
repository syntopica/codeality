import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Every identifier a binding pattern introduces, in source order.
 *
 * `const a = x` binds one name; `const { a, b: { c }, ...rest } = x` binds
 * four. Rules that count or report exported units need the names rather than
 * the declarator, because one declarator can introduce several.
 *
 * An if-chain rather than a switch: the parameter is a general node so callers
 * can pass a declarator id, a property value or an array element without
 * casting, and a switch over that would have to enumerate the whole AST.
 */
export function boundIdentifierNames(pattern: TSESTree.Node | null): string[] {
  if (!pattern) return []

  if (pattern.type === 'Identifier') return [pattern.name]

  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.flatMap((property) =>
      property.type === 'RestElement'
        ? boundIdentifierNames(property.argument)
        : boundIdentifierNames(property.value),
    )
  }

  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.flatMap((element) => boundIdentifierNames(element))
  }

  if (pattern.type === 'RestElement') {
    return boundIdentifierNames(pattern.argument)
  }

  if (pattern.type === 'AssignmentPattern') {
    return boundIdentifierNames(pattern.left)
  }

  return []
}
