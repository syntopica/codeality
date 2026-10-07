import type { CallExpression } from 'estree'

import { EXECUTE_METHODS } from '@/eslint/kysely/EXECUTE_METHODS.js'
import { GUARD_METHODS } from '@/eslint/kysely/GUARD_METHODS.js'
import { isNamedObject } from '@/eslint/kysely/isNamedObject.js'
import { methodChainOf } from '@/eslint/kysely/methodChainOf.js'

/** An execute call whose chain starts at `<name>.<rootMethod>(...)` with no where between. */
export const isUnguardedWrite = (
  node: CallExpression,
  rootMethod: string,
  objectNames: readonly string[],
): boolean => {
  const { methods, base } = methodChainOf(node)
  const last = methods.at(-1)
  if (last === undefined || !EXECUTE_METHODS.has(last)) return false
  const rootIndex = methods.indexOf(rootMethod)
  if (rootIndex === -1 || !isNamedObject(base, objectNames)) return false
  return !methods.slice(rootIndex + 1).some((name) => GUARD_METHODS.has(name))
}
