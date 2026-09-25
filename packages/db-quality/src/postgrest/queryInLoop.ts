import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const queryInLoop: PostgrestRule = {
  code: 'BDB804',
  name: 'query-in-loop',
  severity: 'warn',
  run: (chain) =>
    chain.inLoop
      ? makePostgrestFinding(
          queryInLoop,
          chain,
          chain.target,
          'query runs once per iteration: fetch the set with .in() or a join, or move the query out of the loop',
        )
      : undefined,
}
