import { isComponentNode } from './is-component-node.js'

/**
 * Walks up the AST to find the nearest enclosing top-level function component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEnclosingComponent(node: any): any {
  let curr = node.parent
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
