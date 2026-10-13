import type { TSESTree } from '@typescript-eslint/utils'

/**
 * The name a function is declared under: its own id, or the identifier of the
 * variable it is assigned to. Null for anonymous functions in any other
 * position.
 */
export function functionBindingName(node: TSESTree.Node): string | null {
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name
  if (
    node.parent?.type === 'VariableDeclarator' &&
    node.parent.id.type === 'Identifier'
  ) {
    return node.parent.id.name
  }
  return null
}
