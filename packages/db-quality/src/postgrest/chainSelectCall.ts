import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

/** The `select` call when the chain is a read (select first after the root); undefined for writes and rpc. */
export const chainSelectCall = (
  chain: PostgrestChain,
): PostgrestCall | undefined => {
  const first = chain.calls[0]
  return chain.root === 'from' && first?.name === 'select' ? first : undefined
}
