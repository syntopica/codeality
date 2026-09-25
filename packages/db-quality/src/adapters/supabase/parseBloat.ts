import type { BloatRow } from '@/adapters/supabase/BloatRow.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

export const parseBloat = (
  stdout: string,
  threshold: number,
  disabled: DisableEntry[],
): Finding[] => {
  if (isDisabled('BDB602', disabled)) return []
  const { rows } = JSON.parse(stdout) as { rows: BloatRow[] }
  return rows
    .filter((row) => Number(row.bloat) > threshold)
    .map((row) => {
      const partial = {
        code: 'BDB602',
        severity: 'warn' as const,
        path: 'supabase',
        line: 0,
        message: `bloat factor ${row.bloat}, ${row.waste} wasted`,
        subject: row.name,
      }
      return { ...partial, fingerprint: fingerprintFinding(partial, row.name) }
    })
}
