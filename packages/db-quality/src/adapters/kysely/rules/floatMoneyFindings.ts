import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { moneyColumnTypes } from '@/adapters/kysely/rules/moneyColumnTypes.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

/** BDB320/float-money: a money-named column typed real, float, double, or numeric without a scale. */
export const floatMoneyFindings = (
  migrations: LocatedMigration[],
  disabled: DisableEntry[],
): Finding[] =>
  migrations.flatMap((migration) => {
    const columns = new Map<string, string>()
    for (const compilation of Object.values(migration.dialects))
      for (const statement of compilation.up)
        for (const [column, type] of moneyColumnTypes(statement.sql))
          if (!columns.has(column)) columns.set(column, type)
    return [...columns].flatMap(([column, type]) =>
      kyselyFinding(
        {
          rule: 'float-money',
          severity: 'warn',
          migration,
          message: `money column "${column}" is typed ${type}: binary floats and unscaled decimals round money; use numeric/decimal with a scale, or integer cents`,
          context: column,
        },
        disabled,
      ),
    )
  })
