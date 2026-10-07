/** Nodes that wrap an expression without changing what it evaluates to. */
export const WRAPPER_TYPES = new Set([
  'ChainExpression',
  'TSNonNullExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
])
