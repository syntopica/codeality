import type ts from 'typescript'

import { isIterationCallback } from '@/postgrest/isIterationCallback.js'
import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** Walks up to the enclosing function; a loop statement or an iteration callback on the way means the query runs once per item. */
export const isInsideLoop = (
  compiler: TypeScriptModule,
  node: ts.Node,
): boolean => {
  let current: ts.Node = node.parent
  while (!compiler.isSourceFile(current)) {
    if (compiler.isIterationStatement(current, false)) return true
    if (isIterationCallback(compiler, current)) return true
    if (compiler.isFunctionLike(current)) return false
    current = current.parent
  }
  return false
}
