import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { collectPostgrestChains } from '@/postgrest/collectPostgrestChains.js'
import { loadTypeScript } from '@/postgrest/loadTypeScript.js'
import { POSTGREST_RULES } from '@/postgrest/POSTGREST_RULES.js'
import { sourceFilesUnder } from '@/postgrest/sourceFilesUnder.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'

export const runPostgrestRules = (
  root: string,
  roots: string[],
  knowledge: Map<string, TableKnowledge>,
  disabled: DisableEntry[],
): Finding[] => {
  const rules = POSTGREST_RULES.filter(
    (rule) => !isDisabled(rule.code, disabled),
  )
  const context = { knowledge }
  const compiler = loadTypeScript([join(root, 'package.json'), import.meta.url])
  return sourceFilesUnder(root, roots)
    .flatMap((path) =>
      collectPostgrestChains(
        compiler,
        path,
        readFileSync(join(root, path), 'utf8'),
      ),
    )
    .flatMap((chain) => rules.map((rule) => rule.run(chain, context)))
    .filter((finding): finding is Finding => finding !== undefined)
    .sort(compareFindings)
}
