import { statementAtMatch } from '@/adapters/sqlite/statementAtMatch.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const commaListMembership: SqlRule = {
  code: 'BDB405',
  name: 'comma-list-membership',
  severity: 'warn',
  // instr(',' || ?1 || ',', ',' || col || ','): membership in a comma-joined
  // list, which no index can answer.
  run: (set) =>
    set.flatMap((file) =>
      file.statements.flatMap((statement) => {
        const match =
          /\binstr\s*\(\s*','\s*\|\|\s*(?<param>\?\d*|[:@$][a-z_]\w*)\s*\|\|\s*','/i.exec(
            statement.text,
          )
        if (!match) return []
        const param = match.groups?.['param'] ?? ''
        return [
          makeSqlFinding(
            commaListMembership,
            { file, statement: statementAtMatch(statement, match.index) },
            param,
            `instr() over a comma-joined ${param} cannot use an index; bind a JSON array and filter with col IN (SELECT value FROM json_each(${param}))`,
          ),
        ]
      }),
    ),
}
