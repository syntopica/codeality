import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'
import { statementAtLine } from '@/sql/statementAtLine.js'

/**
 * Drops a BDB404 whose statement the planner still serves from an index. The
 * guard hides one column from the planner, but when another filter already
 * seeks an index (`account_id = ?2 AND (?1 IS NULL OR ...)` in Vexa's
 * `jobs_list.sql` after its fix) nothing is scanned and there is nothing to
 * split the query for.
 */
export const dropIndexedGuards = (
  findings: Finding[],
  files: MigrationFile[],
  scansNothing: (statement: SqlStatement) => boolean,
): Finding[] =>
  findings.filter((finding) => {
    if (finding.code !== 'BDB404') return true
    const file = files.find((candidate) => candidate.path === finding.path)
    const statement = file && statementAtLine(file, finding.line)
    return statement === undefined || !scansNothing(statement)
  })
