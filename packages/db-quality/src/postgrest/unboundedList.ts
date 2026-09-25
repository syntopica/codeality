import { chainSelectCall } from '@/postgrest/chainSelectCall.js'
import { isBounded } from '@/postgrest/isBounded.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const unboundedList: PostgrestRule = {
  code: 'BDB802',
  name: 'unbounded-list',
  severity: 'warn',
  run: (chain, context) => {
    if (
      !chainSelectCall(chain) ||
      !context.knowledge.has(`public.${chain.target}`)
    )
      return undefined
    if (isBounded(chain, context)) return undefined
    return makePostgrestFinding(
      unboundedList,
      chain,
      chain.target,
      'read has no limit, range, single or unique-key equality: it returns the whole table as it grows',
    )
  },
}
