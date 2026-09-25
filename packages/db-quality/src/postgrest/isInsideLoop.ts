import ts from 'typescript'

import { isIterationCallback } from '@/postgrest/isIterationCallback.js'

/** Walks up to the enclosing function; a loop statement or an iteration callback on the way means the query runs once per item. */
export const isInsideLoop = (node: ts.Node): boolean => {
  let current: ts.Node = node.parent
  while (!ts.isSourceFile(current)) {
    if (ts.isIterationStatement(current, false)) return true
    if (isIterationCallback(current)) return true
    if (ts.isFunctionLike(current)) return false
    current = current.parent
  }
  return false
}
