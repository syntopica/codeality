import { statementAtMatch } from '@/adapters/sqlite/statementAtMatch.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const optionalParameterGuard: SqlRule = {
  code: 'BDB404',
  name: 'optional-parameter-guard',
  severity: 'warn',
  // `?1 IS NULL OR col = ?1` and `col = ?1 OR ?1 IS NULL`, for every parameter
  // spelling SQLite binds: ?, ?NNN, :name, @name and $name.
  run: (set) =>
    set.flatMap((file) =>
      file.statements.flatMap((statement) => {
        const match =
          /(?<param>\?\d*|[:@$][a-z_]\w*)\s+is\s+null\s+or\b|\bor\s+(?<trailing>\?\d*|[:@$][a-z_]\w*)\s+is\s+null\b/i.exec(
            statement.text,
          )
        if (!match) return []
        const param =
          match.groups?.['param'] ?? match.groups?.['trailing'] ?? ''
        return [
          makeSqlFinding(
            optionalParameterGuard,
            { file, statement: statementAtMatch(statement, match.index) },
            param,
            `"${param} IS NULL OR" hides the index from the planner: SQLite picks the plan at prepare time, before the value is bound; split the query per case, or bind a non-null sentinel or a json_each list`,
          ),
        ]
      }),
    ),
}
