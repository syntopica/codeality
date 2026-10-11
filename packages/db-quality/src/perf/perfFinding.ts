import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const perfFinding = (
  code: string,
  subject: string,
  context: string,
  message: string,
): Finding => {
  const partial = {
    code,
    severity: 'error' as const,
    path: 'postgres',
    line: 0,
    message,
    subject,
  }
  return { ...partial, fingerprint: fingerprintFinding(partial, context) }
}
