import { isDisabled } from '@/config/isDisabled.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { SQL_RULES } from '@/rules/SQL_RULES.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export const runSqlRules = (
  set: MigrationFile[],
  disabled: string[],
): Finding[] =>
  SQL_RULES.filter((rule) => !isDisabled(rule.code, disabled))
    .flatMap((rule) => rule.run(set))
    .sort(compareFindings)
