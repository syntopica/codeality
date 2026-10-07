import type { Expression, Super } from 'estree'

/** A string, number or boolean literal, or a template literal with no `${}`. */
export const isLiteralValue = (node: Expression | Super): boolean =>
  (node.type === 'Literal' && !('regex' in node)) ||
  (node.type === 'TemplateLiteral' && node.expressions.length === 0)
