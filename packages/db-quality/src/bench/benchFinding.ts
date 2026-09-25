import type { BenchFindingsInput } from '@/bench/BenchFindingsInput.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

// BDB913 warns; the other two bench codes fail the gate. The fingerprint
// context is the query file, not the line: it is always 1, so a line would
// tell two findings on the same file apart no better than the code already does.
export const benchFinding = (
  input: BenchFindingsInput,
  code: string,
  subject: string,
  message: string,
): Finding => {
  const partial = {
    code,
    severity: code === 'BDB913' ? ('warn' as const) : ('error' as const),
    path: `${input.benchDir}/${input.file}`,
    line: 1,
    message,
    subject,
  }
  return { ...partial, fingerprint: fingerprintFinding(partial, input.file) }
}
