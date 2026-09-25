import ts from 'typescript'

import { ITERATION_METHODS } from '@/postgrest/ITERATION_METHODS.js'

export const isIterationCallback = (node: ts.Node): boolean =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isCallExpression(node.parent) &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  ITERATION_METHODS.has(node.parent.expression.name.text)
