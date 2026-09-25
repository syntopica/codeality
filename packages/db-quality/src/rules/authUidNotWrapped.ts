import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTable } from '@/rules/policyTable.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const authUidNotWrapped: SqlRule = {
  code: 'BDB004',
  name: 'auth-uid-not-wrapped',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements
        .filter((statement) => {
          const text = normalizeSqlText(statement.text)
          return (
            text.startsWith('create policy') &&
            /(?<!\(select )auth\.(?:uid|jwt)\(\)/.test(text)
          )
        })
        .map((statement) =>
          makeSqlFinding(
            authUidNotWrapped,
            { file, statement },
            policyTable(statement) ?? '',
            'auth.uid() or auth.jwt() is re-evaluated per row; wrap it as (select auth.uid()) so Postgres caches it as an initplan',
          ),
        ),
    ),
}
