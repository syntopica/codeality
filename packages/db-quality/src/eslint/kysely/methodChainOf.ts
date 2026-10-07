import type { Expression, Super } from 'estree'

import type { MethodChain } from '@/eslint/kysely/MethodChain.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

/** Walks `a.b(...).c(...).d(...)` down to `a`, collecting `b`, `c`, `d`. */
export const methodChainOf = (node: Expression | Super): MethodChain => {
  const methods: string[] = []
  let current = unwrapped(node)
  while (
    current.type === 'CallExpression' &&
    current.callee.type === 'MemberExpression' &&
    !current.callee.computed &&
    current.callee.property.type === 'Identifier'
  ) {
    methods.unshift(current.callee.property.name)
    current = unwrapped(current.callee.object)
  }
  return { methods, base: current }
}
