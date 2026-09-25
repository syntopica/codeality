import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import type { StatementRef } from '@/rules/StatementRef.js'

export const makeSqlFinding = (
  rule: Pick<SqlRule, 'code' | 'severity'>,
  { file, statement }: StatementRef,
  subject: string,
  message: string,
): Finding => {
  const partial = {
    code: rule.code,
    severity: rule.severity,
    path: file.path,
    line: statement.line,
    message,
    subject,
  }
  return {
    ...partial,
    fingerprint: fingerprintFinding(partial, normalizeSqlText(statement.text)),
  }
}
