import type { SqlStatement } from '@/sql/SqlStatement.js'

/**
 * A DELETE or UPDATE with no WHERE: it touches every row on purpose, so its
 * full scan is the operation itself and no index could narrow it. Vexa's
 * `clear_replayed_*.sql` files, each a bare `DELETE FROM <table>`, were told
 * to "give the filter an index" they do not have.
 */
export const isWholeTableWrite = (statement: SqlStatement): boolean =>
  /^(?:delete|update)\b/i.test(statement.text) &&
  !/\bwhere\b/i.test(statement.text)
