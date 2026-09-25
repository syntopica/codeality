import { FILTER_METHODS } from '@/postgrest/FILTER_METHODS.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const filterWithoutIndex: PostgrestRule = {
  code: 'BDB803',
  name: 'filter-without-index',
  severity: 'warn',
  run: (chain, context) => {
    if (chain.root !== 'from') return undefined
    const knowledge = context.knowledge.get(`public.${chain.target}`)
    if (!knowledge) return undefined
    const filter = chain.calls.find(
      (call) =>
        FILTER_METHODS.has(call.name) &&
        call.args[0] !== undefined &&
        call.args[0] !== '?' &&
        !call.args[0].includes('.') &&
        !knowledge.indexed.has(call.args[0].toLowerCase()),
    )
    if (!filter) return undefined
    const column = filter.args[0] ?? ''
    return makePostgrestFinding(
      filterWithoutIndex,
      chain,
      `${chain.target}.${column}`,
      `${filter.name}('${column}') filters a column no migration indexes: a sequential scan on every call`,
    )
  },
}
