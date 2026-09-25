import { chainSelectCall } from '@/postgrest/chainSelectCall.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const exactCountUnbounded: PostgrestRule = {
  code: 'BDB805',
  name: 'exact-count-unbounded',
  severity: 'warn',
  run: (chain) => {
    const options = chainSelectCall(chain)?.args[1] ?? ''
    if (!options.includes('count:exact') || options.includes('head:true'))
      return undefined
    if (
      chain.calls.some((call) => call.name === 'limit' || call.name === 'range')
    )
      return undefined
    return makePostgrestFinding(
      exactCountUnbounded,
      chain,
      chain.target,
      'count: exact with no limit or range counts and returns the whole table; use head: true for the count alone or bound the rows',
    )
  },
}
