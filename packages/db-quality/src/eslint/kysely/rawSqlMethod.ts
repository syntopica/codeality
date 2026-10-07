import type { CallExpression } from 'estree'

import { RAW_SQL_METHODS } from '@/eslint/kysely/RAW_SQL_METHODS.js'

/** `raw` for `sql.raw(...)`, and so on; undefined for any other call. */
export const rawSqlMethod = (node: CallExpression): string | undefined => {
  const callee = node.callee
  if (
    callee.type !== 'MemberExpression' ||
    callee.computed ||
    callee.object.type !== 'Identifier' ||
    callee.object.name !== 'sql' ||
    callee.property.type !== 'Identifier'
  )
    return undefined
  const name = callee.property.name
  return RAW_SQL_METHODS.has(name) ? name : undefined
}
