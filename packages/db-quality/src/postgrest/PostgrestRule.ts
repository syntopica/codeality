import type { Finding } from '@/model/Finding.js'
import type { Severity } from '@/model/Severity.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { RuleContext } from '@/postgrest/RuleContext.js'

export type PostgrestRule = {
  code: string
  name: string
  severity: Severity
  run: (chain: PostgrestChain, context: RuleContext) => Finding | undefined
}
