import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { isInlineReference } from '@/adapters/kysely/rules/isInlineReference.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import { normalizeSqlText } from '@/model/normalizeSqlText.js'

// MySQL 8.4 parses a column-level REFERENCES and silently ignores it: no
// foreign key is created. MariaDB and SQLite enforce the same clause, so the
// schema behaves differently per engine without any error.
/** BDB320/inline-references: a column `.references()` in the MySQL SQL of a create or alter table. */
export const inlineReferencesFindings = (
  migrations: LocatedMigration[],
  disabled: DisableEntry[],
): Finding[] =>
  migrations.flatMap((migration) =>
    (migration.dialects.mysql?.up ?? [])
      .filter((statement) => isInlineReference(statement.sql))
      .flatMap((statement) =>
        kyselyFinding(
          {
            rule: 'inline-references',
            severity: 'error',
            migration,
            message:
              'a column-level .references() compiles to an inline REFERENCES, which MySQL 8.4 parses and ignores (no foreign key is created) while MariaDB and SQLite enforce it; declare it with addForeignKeyConstraint() instead',
            context: normalizeSqlText(statement.sql),
          },
          disabled,
        ),
      ),
  )
