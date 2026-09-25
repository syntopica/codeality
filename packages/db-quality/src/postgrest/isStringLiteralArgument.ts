import ts from 'typescript'

/** True when `node` is a string literal or a no-substitution template literal: the only forms a `.from()`/`.rpc()` root target may take. */
export const isStringLiteralArgument = (
  node: ts.Expression | undefined,
): boolean =>
  node !== undefined &&
  (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
