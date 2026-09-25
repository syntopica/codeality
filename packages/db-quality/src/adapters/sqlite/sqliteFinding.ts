import type { SqliteFindingInput } from '@/adapters/sqlite/SqliteFindingInput.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

/** Zero or one finding on a SQLite file: none when the code is disabled. Line is always 0. */
export const sqliteFinding = (
  input: SqliteFindingInput,
  disabled: DisableEntry[],
): Finding[] => {
  if (isDisabled(input.code, disabled)) return []
  const partial = {
    code: input.code,
    severity: input.severity,
    path: input.file,
    line: 0,
    message: input.message,
    subject: input.subject,
  }
  return [
    { ...partial, fingerprint: fingerprintFinding(partial, input.context) },
  ]
}
