import type ts from 'typescript'

import { chainFromCall } from '@/postgrest/chainFromCall.js'
import { isInnerCall } from '@/postgrest/isInnerCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

export const collectPostgrestChains = (
  compiler: TypeScriptModule,
  path: string,
  source: string,
): PostgrestChain[] => {
  const file = compiler.createSourceFile(
    path,
    source,
    compiler.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? compiler.ScriptKind.TSX : compiler.ScriptKind.TS,
  )
  const chains: PostgrestChain[] = []
  const visit = (node: ts.Node): void => {
    if (compiler.isCallExpression(node) && !isInnerCall(compiler, node)) {
      const chain = chainFromCall(compiler, node, file, path)
      if (chain) chains.push(chain)
    }
    compiler.forEachChild(node, visit)
  }
  visit(file)
  return chains
}
