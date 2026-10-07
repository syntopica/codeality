import type { Expression, Super } from 'estree'

import { WRAPPER_TYPES } from '@/eslint/kysely/WRAPPER_TYPES.js'
import type { WrappingNode } from '@/eslint/kysely/WrappingNode.js'

/** The expression under any `?.`, `!`, `as`, `satisfies` or `<T>` wrapping. */
export const unwrapped = (node: Expression | Super): Expression | Super => {
  let current = node
  while (WRAPPER_TYPES.has(current.type))
    current = (current as unknown as WrappingNode).expression
  return current
}
