import type { Rule } from 'eslint'
import type { Expression, Super } from 'estree'

import { isLiteralType } from '@/eslint/kysely/isLiteralType.js'
import type { TypedParserServices } from '@/eslint/kysely/TypedParserServices.js'

// Only when the file was parsed with type information (typescript-eslint's
// projectService); without it the parser leaves `program` null.
/** True when TypeScript types the expression as a literal or a union of literals. */
export const hasLiteralType = (
  node: Expression | Super,
  context: Rule.RuleContext,
): boolean => {
  const services = context.sourceCode.parserServices as
    TypedParserServices | undefined
  const program = services?.program
  const map = services?.esTreeNodeToTSNodeMap
  if (!program || !map) return false
  return isLiteralType(
    program.getTypeChecker().getTypeAtLocation(map.get(node)),
  )
}
