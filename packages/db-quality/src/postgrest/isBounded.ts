import { BOUNDING_METHODS } from '@/postgrest/BOUNDING_METHODS.js'
import { chainSelectCall } from '@/postgrest/chainSelectCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { RuleContext } from '@/postgrest/RuleContext.js'

export const isBounded = (
  chain: PostgrestChain,
  context: RuleContext,
): boolean => {
  if (chain.calls.some((call) => BOUNDING_METHODS.has(call.name))) return true
  if (chainSelectCall(chain)?.args[1]?.includes('head:true')) return true
  const unique = context.knowledge.get(`public.${chain.target}`)?.unique
  return chain.calls.some(
    (call) =>
      call.name === 'eq' &&
      call.args[0] !== undefined &&
      unique?.has(call.args[0].toLowerCase()) === true,
  )
}
