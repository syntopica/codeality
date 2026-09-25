import { relative } from 'node:path'

import type { EslintFileResult } from '@/adapters/drizzle/EslintFileResult.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parseEslintReport = (
  stdout: string,
  root: string,
  disabled: DisableEntry[],
): Finding[] => {
  if (!stdout.trim()) return []
  let files: EslintFileResult[]
  try {
    files = JSON.parse(stdout) as EslintFileResult[]
  } catch {
    throw new Error(`eslint produced no JSON report: ${stdout.slice(0, 200)}`)
  }
  return files.flatMap((file) =>
    file.messages.flatMap((message) => {
      if (!message.ruleId?.startsWith('drizzle/')) return []
      const rule = message.ruleId.slice('drizzle/'.length)
      const code = `BDB300/${rule}`
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
