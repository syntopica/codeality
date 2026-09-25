import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

export const definerWithoutSearchPath: SqlRule = {
  code: 'BDB005',
  name: 'definer-without-search-path',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements.flatMap((statement) => {
        const text = normalizeSqlText(statement.text)
        const head =
          /^create (?:or replace )?(?:function|procedure) ((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)\s*\(/.exec(
            text,
          )
        if (
          !head?.[1] ||
          !text.includes(' security definer') ||
          text.includes(' set search_path')
        ) {
          return []
        }
        return [
          makeSqlFinding(
            definerWithoutSearchPath,
            { file, statement },
            qualifiedName(head[1]),
            'SECURITY DEFINER function without "set search_path": a caller can shadow the objects it touches',
          ),
        ]
      }),
    ),
}
