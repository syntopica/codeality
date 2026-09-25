import type { PrismaViolation } from '@/adapters/prisma/PrismaViolation.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parsePrismaLintReport = (
  stderr: string,
  disabled: string[],
): Finding[] => {
  if (!stderr.trim()) return []
  let violations: PrismaViolation[]
  try {
    violations = (JSON.parse(stderr) as { violations: PrismaViolation[] })
      .violations
  } catch {
    throw new Error(
      `prisma-lint produced no JSON report: ${stderr.slice(0, 200)}`,
    )
  }
  return violations.flatMap((violation) => {
    const code = `BDB200/${violation.ruleName}`
    if (isDisabled(code, disabled)) return []
    const partial = {
      code,
      severity: 'warn' as const,
      path: violation.fileName,
      line: violation.location.startLine,
      message: violation.message,
      subject: /Field "([^"]+)"/.exec(violation.message)?.[1] ?? '',
    }
    return [
      {
        ...partial,
        fingerprint: fingerprintFinding(partial, violation.message),
      },
    ]
  })
}
