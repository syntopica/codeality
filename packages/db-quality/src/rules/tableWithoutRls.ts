import { createdTables } from '@/rules/createdTables.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { rlsEnabledTables } from '@/rules/rlsEnabledTables.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const tableWithoutRls: SqlRule = {
  code: 'BDB003',
  name: 'table-without-rls',
  severity: 'warn',
  run: (set) => {
    const enabled = rlsEnabledTables(set)
    return [...createdTables(set)]
      .filter(([table]) => !enabled.has(table))
      .map(([table, ref]) =>
        makeSqlFinding(
          tableWithoutRls,
          ref,
          table,
          'table in public never enables row level security: it is readable through the Data API by anyone holding the anon key',
        ),
      )
  },
}
