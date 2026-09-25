import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTables } from '@/rules/policyTables.js'
import { rlsEnabledTables } from '@/rules/rlsEnabledTables.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const rlsEnabledNoPolicy: SqlRule = {
  code: 'BDB002',
  name: 'rls-enabled-no-policy',
  severity: 'warn',
  run: (set) => {
    const withPolicy = policyTables(set)
    return [...rlsEnabledTables(set)]
      .filter(([table]) => !withPolicy.has(table))
      .map(([table, ref]) =>
        makeSqlFinding(
          rlsEnabledNoPolicy,
          ref,
          table,
          'RLS is enabled but no migration defines a policy: only the service role can reach this table',
        ),
      )
  },
}
