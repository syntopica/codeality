import ts from 'typescript'

/** True when the call continues into a longer chain (`a.b().c()`: `b()` is inner, `c()` is not). */
export const isInnerCall = (node: ts.CallExpression): boolean =>
  ts.isPropertyAccessExpression(node.parent) &&
  ts.isCallExpression(node.parent.parent) &&
  node.parent.parent.expression === node.parent
