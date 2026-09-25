import { chainSelectCall } from '@/postgrest/chainSelectCall.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const starSelect: PostgrestRule = {
  code: 'BDB801',
  name: 'select-star',
  severity: 'warn',
  run: (chain) => {
    const select = chainSelectCall(chain)
    if (!select) return undefined
    const list = select.args[0]
    if (list !== undefined && list !== '?' && !list.includes('*'))
      return undefined
    if (list === '?') return undefined
    return makePostgrestFinding(
      starSelect,
      chain,
      chain.target,
      'select fetches every column: name the columns the caller reads, so a new wide column never travels for free',
    )
  },
}
