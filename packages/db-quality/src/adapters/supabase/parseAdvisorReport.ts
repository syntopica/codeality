import { ADVISOR_SEVERITY } from '@/adapters/supabase/ADVISOR_SEVERITY.js'
import type { AdvisorEntry } from '@/adapters/supabase/AdvisorEntry.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parseAdvisorReport = (
  stdout: string,
  disabled: DisableEntry[],
): Finding[] => {
  const { results } = JSON.parse(stdout) as { results: AdvisorEntry[] }
  return results.flatMap((entry) => {
    const code = `BDB500/${entry.name}`
    if (isDisabled(code, disabled)) return []
    const subject =
      entry.metadata?.schema && entry.metadata.name
        ? `${entry.metadata.schema}.${entry.metadata.name}`
        : ''
    const partial = {
      code,
      severity: ADVISOR_SEVERITY[entry.level],
      path: 'supabase',
      line: 0,
      message: entry.detail.replaceAll('\\`', '`'),
      subject,
    }
    return [
      { ...partial, fingerprint: fingerprintFinding(partial, entry.detail) },
    ]
  })
}
