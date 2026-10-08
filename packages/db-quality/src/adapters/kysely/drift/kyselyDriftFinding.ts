import type { KyselyDriftFindingOptions } from '@/adapters/kysely/drift/KyselyDriftFindingOptions.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

/** Zero or one `BDB330/<rule>` finding: none when the code is disabled. */
export const kyselyDriftFinding = ({
  rule,
  severity,
  path,
  line,
  message,
  subject,
  disabled,
}: KyselyDriftFindingOptions): Finding[] => {
  const code = `BDB330/${rule}`
  if (isDisabled(code, disabled)) return []
  const partial = { code, severity, path, line, message, subject }
  return [
    {
      ...partial,
      fingerprint: fingerprintFinding(partial, `${subject}|${message}`),
    },
  ]
}
