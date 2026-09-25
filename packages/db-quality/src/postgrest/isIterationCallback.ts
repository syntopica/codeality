import type ts from 'typescript'

import { ITERATION_METHODS } from '@/postgrest/ITERATION_METHODS.js'
import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

export const isIterationCallback = (
  compiler: TypeScriptModule,
  node: ts.Node,
): boolean =>
  (compiler.isArrowFunction(node) || compiler.isFunctionExpression(node)) &&
  compiler.isCallExpression(node.parent) &&
  compiler.isPropertyAccessExpression(node.parent.expression) &&
  ITERATION_METHODS.has(node.parent.expression.name.text)
