import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const makePostgrestFinding = (
  rule: Pick<PostgrestRule, 'code' | 'severity'>,
  chain: PostgrestChain,
  subject: string,
  message: string,
): Finding => {
  const partial = {
    code: rule.code,
    severity: rule.severity,
    path: chain.path,
    line: chain.line,
    message,
    subject,
  }
  return { ...partial, fingerprint: fingerprintFinding(partial, chain.text) }
}
