import type { KyselyFindingInput } from '@/adapters/kysely/KyselyFindingInput.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

/** Zero or one `BDB320/<rule>` finding on a migration: none when the code is disabled. */
export const kyselyFinding = (
  input: KyselyFindingInput,
  disabled: DisableEntry[],
): Finding[] => {
  const code = `BDB320/${input.rule}`
  if (isDisabled(code, disabled)) return []
  const partial = {
    code,
    severity: input.severity,
    path: input.migration.path,
    line: input.migration.line,
    message: input.message,
    subject: input.migration.name,
  }
  return [
    {
      ...partial,
      fingerprint: fingerprintFinding(
        partial,
        `${input.migration.name}|${input.context}`,
      ),
    },
  ]
}
