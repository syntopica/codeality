import type { TSESTree } from '@typescript-eslint/utils'

import { isComponentNode } from '@/utils/is-component-node.js'

type ComponentFunction =
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression

/**
 * Walks up the AST to find the nearest enclosing top-level function component.
 */
export function getEnclosingComponent(
  node: TSESTree.Node,
): ComponentFunction | null {
  let curr: TSESTree.Node | undefined = node.parent
  while (curr) {
    if (
      (curr.type === 'FunctionDeclaration' ||
        curr.type === 'ArrowFunctionExpression' ||
        curr.type === 'FunctionExpression') &&
      isComponentNode(curr)
    ) {
      return curr
    }
    curr = curr.parent
  }
  return null
}
