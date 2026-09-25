import type ts from 'typescript'

import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** True when `node` is a string literal or a no-substitution template literal: the only forms a `.from()`/`.rpc()` root target may take. */
export const isStringLiteralArgument = (
  compiler: TypeScriptModule,
  node: ts.Expression | undefined,
): boolean =>
  node !== undefined &&
  (compiler.isStringLiteral(node) ||
    compiler.isNoSubstitutionTemplateLiteral(node))
