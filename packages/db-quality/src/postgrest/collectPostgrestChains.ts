import ts from 'typescript'

import { chainFromCall } from '@/postgrest/chainFromCall.js'
import { isInnerCall } from '@/postgrest/isInnerCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

export const collectPostgrestChains = (
  path: string,
  source: string,
): PostgrestChain[] => {
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const chains: PostgrestChain[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && !isInnerCall(node)) {
      const chain = chainFromCall(node, file, path)
      if (chain) chains.push(chain)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return chains
}
