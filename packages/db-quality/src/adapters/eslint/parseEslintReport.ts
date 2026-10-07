import { relative } from 'node:path'

import type { EslintFamily } from '@/adapters/eslint/EslintFamily.js'
import type { EslintFileResult } from '@/adapters/eslint/EslintFileResult.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parseEslintReport = (
  stdout: string,
  root: string,
  disabled: DisableEntry[],
  family: EslintFamily,
): Finding[] => {
  const prefix = `${family.plugin}/`
  if (!stdout.trim()) return []
  let files: EslintFileResult[]
  try {
    files = JSON.parse(stdout) as EslintFileResult[]
  } catch {
    throw new Error(`eslint produced no JSON report: ${stdout.slice(0, 200)}`)
  }
  return files.flatMap((file) =>
    file.messages.flatMap((message) => {
      if (!message.ruleId?.startsWith(prefix)) return []
      const rule = message.ruleId.slice(prefix.length)
      const code = `${family.code}/${rule}`
      if (isDisabled(code, disabled)) return []
      const partial = {
        code,
        severity: 'error' as const,
        path: relative(root, file.filePath).replaceAll('\\', '/'),
        line: message.line,
        message: message.message,
        subject: rule,
      }
      return [
        {
          ...partial,
          fingerprint: fingerprintFinding(partial, message.message),
        },
      ]
    }),
  )
}
