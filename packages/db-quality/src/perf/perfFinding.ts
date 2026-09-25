import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

// Severity follows from the code alone: BDB901 (a regression) is the only
// perf rule that fails the gate; the rest warn. Keeping severity out of the
// parameter list holds this at 4 params, the monorepo's max-params budget.
export const perfFinding = (
  code: string,
  subject: string,
  context: string,
  message: string,
): Finding => {
  const partial = {
    code,
    severity: code === 'BDB901' ? ('error' as const) : ('warn' as const),
    path: 'postgres',
    line: 0,
    message,
    subject,
  }
  return { ...partial, fingerprint: fingerprintFinding(partial, context) }
}
