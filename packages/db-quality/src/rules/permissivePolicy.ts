import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTable } from '@/rules/policyTable.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const permissivePolicy: SqlRule = {
  code: 'BDB001',
  name: 'permissive-policy',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements
        .filter((statement) => {
          const text = normalizeSqlText(statement.text)
          return (
            text.startsWith('create policy') &&
            /(?:using|with check) \( ?true ?\)/.test(text)
          )
        })
        .map((statement) =>
          makeSqlFinding(
            permissivePolicy,
            { file, statement },
            policyTable(statement) ?? '',
            'policy is permissive: using (true) or with check (true) lets every row through for the granted role',
          ),
        ),
    ),
}
