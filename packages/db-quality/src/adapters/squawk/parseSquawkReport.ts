import type { SquawkEntry } from '@/adapters/squawk/SquawkEntry.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { statementAtLine } from '@/sql/statementAtLine.js'

export const parseSquawkReport = (
  stdout: string,
  set: MigrationFile[],
  disabled: DisableEntry[],
): Finding[] => {
  if (!stdout.trim()) return []
  let entries: SquawkEntry[]
  try {
    entries = JSON.parse(stdout) as SquawkEntry[]
  } catch {
    throw new Error(`squawk produced no JSON report: ${stdout.slice(0, 200)}`)
  }
  return entries.flatMap((entry) => {
    const code = `BDB100/${entry.rule_name}`
    if (isDisabled(code, disabled)) return []
    const file = set.find((candidate) => candidate.path === entry.file)
    const statement = file ? statementAtLine(file, entry.line) : undefined
    const partial = {
      code,
      severity:
        entry.level === 'Error' ? ('error' as const) : ('warn' as const),
      path: entry.file,
      line: entry.line,
      message: entry.message,
      subject: entry.rule_name,
    }
    const context = statement ? normalizeSqlText(statement.text) : entry.message
    return [{ ...partial, fingerprint: fingerprintFinding(partial, context) }]
  })
}
