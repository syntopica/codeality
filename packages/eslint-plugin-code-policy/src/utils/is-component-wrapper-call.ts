import type { TSESTree } from '@typescript-eslint/utils'

const WRAPPERS = new Set(['memo', 'forwardRef'])

/**
 * `memo(...)`, `forwardRef(...)` and their `React.` forms: the function passed
 * in is the component, so its body is a view like any other.
 */
export function isComponentWrapperCall(node: TSESTree.Node): boolean {
  if (node.type !== 'CallExpression') return false
  const callee = node.callee
  if (callee.type === 'Identifier') return WRAPPERS.has(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'React' &&
    callee.property.type === 'Identifier' &&
    WRAPPERS.has(callee.property.name)
  )
}
