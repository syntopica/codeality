import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { qualifiedName } from '@/sql/qualifiedName.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const policyTable = (statement: SqlStatement): string | undefined => {
  const match =
    /^create policy .+? on ((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)/.exec(
      normalizeSqlText(statement.text),
    )
  return match?.[1] === undefined ? undefined : qualifiedName(match[1])
}
