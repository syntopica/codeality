import type { IndexStatRow } from '@/adapters/supabase/IndexStatRow.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

// A primary key index is never "unused" in a way anyone can act on.
export const parseIndexStats = (
  stdout: string,
  disabled: DisableEntry[],
): Finding[] => {
  if (isDisabled('BDB601', disabled)) return []
  const { rows } = JSON.parse(stdout) as { rows: IndexStatRow[] }
  return rows
    .filter(
      (row) =>
        (row.unused || row.index_scans === '0') && !row.name.endsWith('_pkey'),
    )
    .map((row) => {
      const partial = {
        code: 'BDB601',
        severity: 'warn' as const,
        path: 'supabase',
        line: 0,
        message: `index has never been scanned (${row.size})`,
        subject: row.name,
      }
      return { ...partial, fingerprint: fingerprintFinding(partial, row.name) }
    })
}
