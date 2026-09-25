import { hasPrimaryKey } from '@/adapters/sqlite/hasPrimaryKey.js'
import { sqliteFinding } from '@/adapters/sqlite/sqliteFinding.js'
import { sqliteRows } from '@/adapters/sqlite/sqliteRows.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** BDB403: every user table whose CREATE statement declares no primary key. */
export const primaryKeyFindings = (
  runner: CommandRunner,
  root: string,
  file: string,
  disabled: DisableEntry[],
): Finding[] =>
  sqliteRows<{ name: string; sql: string }>(
    runner,
    root,
    file,
    "select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%'",
  ).flatMap((row) =>
    hasPrimaryKey(row.sql)
      ? []
      : sqliteFinding(
          {
            code: 'BDB403',
            severity: 'warn',
            file,
            subject: row.name,
            message: 'table has no primary key',
            context: row.name,
          },
          disabled,
        ),
  )
