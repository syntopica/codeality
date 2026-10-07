import type { Rule, Scope } from 'eslint'
import type { Expression, Node, SpreadElement } from 'estree'

import { constInitializer } from '@/eslint/kysely/constInitializer.js'
import { hasLiteralType } from '@/eslint/kysely/hasLiteralType.js'
import { isStaticSqlArgument } from '@/eslint/kysely/isStaticSqlArgument.js'
import { unwrapped } from '@/eslint/kysely/unwrapped.js'

// The syntax decides first, so a file linted without type information is
// judged the same way; the type then covers what syntax cannot follow, such
// as an imported `as const` array or a parameter typed as a literal union.
// TypeScript types a template as `string` even when every part is a literal
// union, so a template, or a `const` bound to one, is judged part by part.
// `followed` stops a self-referencing initializer from recursing forever.
/** An argument fixed in the source: static by syntax, typed as a literal (union), or a template of such parts. */
export const isFixedSqlArgument = (
  argument: Expression | SpreadElement,
  scope: Scope.Scope,
  context: Rule.RuleContext,
  followed: ReadonlySet<Node> = new Set(),
): boolean => {
  if (argument.type === 'SpreadElement') return false
  if (isStaticSqlArgument(argument, scope)) return true
  const node = unwrapped(argument)
  if (hasLiteralType(node, context)) return true
  if (node.type === 'TemplateLiteral')
    return node.expressions.every((part) =>
      isFixedSqlArgument(part, scope, context, followed),
    )
  if (node.type !== 'Identifier') return false
  const init = constInitializer(node, scope)
  if (init?.type !== 'TemplateLiteral' || followed.has(init)) return false
  return isFixedSqlArgument(
    init,
    context.sourceCode.getScope(init),
    context,
    new Set([...followed, init]),
  )
}
