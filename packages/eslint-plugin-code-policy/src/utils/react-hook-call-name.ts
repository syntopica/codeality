import type { TSESTree } from '@typescript-eslint/utils'

/**
 * The hook name a call reaches: `useState` for both `useState()` and
 * `React.useState()`. Null for any other callee.
 */
export function reactHookCallName(callee: TSESTree.Expression): string | null {
  if (callee.type === 'Identifier') return callee.name
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'React' &&
    callee.property.type === 'Identifier'
  ) {
    return callee.property.name
  }
  return null
}
