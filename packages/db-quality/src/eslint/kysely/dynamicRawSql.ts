import type { Rule } from 'eslint'

import { isFixedSqlArgument } from '@/eslint/kysely/isFixedSqlArgument.js'
import { rawSqlMethod } from '@/eslint/kysely/rawSqlMethod.js'

// A `sql` tagged template binds its `${}` values as parameters and is safe;
// these helpers splice their argument into the text, so only a value fixed in
// the source can reach them.
export const dynamicRawSql: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid a non-literal argument to sql.raw, sql.lit, sql.id, sql.ref and sql.table.',
    },
    schema: [],
    messages: {
      dynamicRawSql:
        'sql.{{method}}() with an argument that is not a literal, a const bound to one or a value typed as a literal union splices it into the query text: an injection path. Bind it in a sql`` template, or validate it against a const list',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const method = rawSqlMethod(node)
        if (method === undefined) return
        const scope = context.sourceCode.getScope(node)
        if (
          node.arguments.every((arg) => isFixedSqlArgument(arg, scope, context))
        )
          return
        context.report({ node, messageId: 'dynamicRawSql', data: { method } })
      },
    }
  },
}
