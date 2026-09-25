import ts from 'typescript'

import type { CollectedCall } from '@/postgrest/CollectedCall.js'
import { isInsideLoop } from '@/postgrest/isInsideLoop.js'
import { isStorageReceiver } from '@/postgrest/isStorageReceiver.js'
import { isStringLiteralArgument } from '@/postgrest/isStringLiteralArgument.js'
import { literalArgument } from '@/postgrest/literalArgument.js'
import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

/** The chain ending at `outer`, or undefined when no `.from('x')`/`.rpc('f')` with a literal sits in it. */
export const chainFromCall = (
  outer: ts.CallExpression,
  file: ts.SourceFile,
  path: string,
): PostgrestChain | undefined => {
  const calls: CollectedCall[] = []
  let current: ts.Expression = outer
  while (
    ts.isCallExpression(current) &&
    ts.isPropertyAccessExpression(current.expression)
  ) {
    calls.unshift({
      name: current.expression.name.text,
      args: current.arguments.map(literalArgument),
      node: current,
    })
    current = current.expression.expression
  }
  const rootIndex = calls.findIndex(
    (call) =>
      (call.name === 'from' || call.name === 'rpc') &&
      isStringLiteralArgument(call.node.arguments[0]),
  )
  const root = calls[rootIndex]
  if (!root) return undefined
  if (rootIndex === 0 && isStorageReceiver(current)) return undefined
  const rest: PostgrestCall[] = calls
    .slice(rootIndex + 1)
    .map(({ name, args }) => ({ name, args }))
  return {
    path,
    line: file.getLineAndCharacterOfPosition(root.node.getStart(file)).line + 1,
    root: root.name as 'from' | 'rpc',
    target: root.args[0] ?? '',
    calls: rest,
    inLoop: isInsideLoop(outer),
    text: outer.getText(file).replaceAll(/\s+/g, ' '),
  }
}
