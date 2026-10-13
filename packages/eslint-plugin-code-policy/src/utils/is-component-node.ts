import type { TSESTree } from '@typescript-eslint/utils'

import { functionBindingName } from '@/utils/function-binding-name.js'
import { isComponentWrapperCall } from '@/utils/is-component-wrapper-call.js'
import { isTopLevelPosition } from '@/utils/is-top-level-position.js'
import { startsWithCamelPrefix } from '@/utils/starts-with-camel-prefix.js'

/**
 * Determines whether a function node is a top-level component declaration:
 * a module-scope function, or one passed to a module-scope `memo` or
 * `forwardRef`. A function named `useXxx` is a custom hook, not a view, even
 * in a `.tsx` file - calling React hooks is what it exists for.
 */
export function isComponentNode(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return false
  const wrapped = isComponentWrapperCall(parent) && isTopLevelPosition(parent)
  if (!wrapped && !isTopLevelPosition(node)) return false
  const name = functionBindingName(wrapped ? parent : node)
  return !(name && startsWithCamelPrefix(name, 'use'))
}
