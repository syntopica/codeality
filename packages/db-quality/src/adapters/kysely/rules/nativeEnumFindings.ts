import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { NATIVE_ENUM_PATTERN } from '@/adapters/kysely/rules/NATIVE_ENUM_PATTERN.js'
import { withoutQuotedSpans } from '@/adapters/kysely/rules/withoutQuotedSpans.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import type { Finding } from '@/model/Finding.js'

/** BDB320/native-enum: `create type ... as enum` or an `enum(` column, when several dialects are configured. */
export const nativeEnumFindings = (
  migrations: LocatedMigration[],
  dialects: KyselyDialect[],
  disabled: DisableEntry[],
): Finding[] => {
  if (dialects.length < 2) return []
  return migrations
    .filter((migration) =>
      Object.values(migration.dialects).some((compilation) =>
        compilation.up.some((statement) =>
          NATIVE_ENUM_PATTERN.test(withoutQuotedSpans(statement.sql)),
        ),
      ),
    )
    .flatMap((migration) =>
      kyselyFinding(
        {
          rule: 'native-enum',
          severity: 'warn',
          migration,
          message: `a native enum does not port across ${dialects.join(', ')}: use a text column with a check constraint, or a lookup table`,
          context: 'native enum',
        },
        disabled,
      ),
    )
}
