import { sqliteFinding } from '@/adapters/sqlite/sqliteFinding.js'
import { sqliteRows } from '@/adapters/sqlite/sqliteRows.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** BDB401: `PRAGMA integrity_check` answered anything but a single `ok`. */
export const integrityFindings = (
  runner: CommandRunner,
  root: string,
  file: string,
  disabled: string[],
): Finding[] => {
  const rows = sqliteRows<{ integrity_check: string }>(
    runner,
    root,
    file,
    'PRAGMA integrity_check',
  )
  const first = rows[0]?.integrity_check ?? 'no result'
  if (rows.length === 1 && first === 'ok') return []
  return sqliteFinding(
    {
      code: 'BDB401',
      severity: 'error',
      file,
      subject: '',
      message: `integrity_check: ${first}`,
      context: first,
    },
    disabled,
  )
}
