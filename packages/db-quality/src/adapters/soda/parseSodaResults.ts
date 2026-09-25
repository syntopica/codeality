import type { SodaCheckResult } from '@/adapters/soda/SodaCheckResult.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parseSodaResults = (
  json: string,
  sodaDir: string,
  disabled: DisableEntry[],
): Finding[] => {
  const { checks } = JSON.parse(json) as { checks: SodaCheckResult[] }
  return checks.flatMap((check) => {
    if (check.outcome !== 'fail' && check.outcome !== 'warn') return []
    const code = `BDB700/${check.name}`
    if (isDisabled(code, disabled)) return []
    const partial = {
      code,
      severity:
        check.outcome === 'fail' ? ('error' as const) : ('warn' as const),
      path: `${sodaDir}/checks.yml`,
      line: 0,
      message: `check ${check.outcome === 'fail' ? 'failed' : 'warned'}: ${check.name}`,
      subject: [check.table, check.column].filter(Boolean).join('.'),
    }
    return [
      { ...partial, fingerprint: fingerprintFinding(partial, check.name) },
    ]
  })
}
