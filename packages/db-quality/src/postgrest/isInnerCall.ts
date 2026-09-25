import type ts from 'typescript'

import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** True when the call continues into a longer chain (`a.b().c()`: `b()` is inner, `c()` is not). */
export const isInnerCall = (
  compiler: TypeScriptModule,
  node: ts.CallExpression,
): boolean =>
  compiler.isPropertyAccessExpression(node.parent) &&
  compiler.isCallExpression(node.parent.parent) &&
  node.parent.parent.expression === node.parent
