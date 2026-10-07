import { MONEY_COLUMN_PATTERN } from '@/adapters/kysely/rules/MONEY_COLUMN_PATTERN.js'

/** `column -> type` for every money-named column the SQL types as a float or an unscaled decimal. */
export const moneyColumnTypes = (sql: string): Map<string, string> =>
  new Map(
    [...sql.matchAll(MONEY_COLUMN_PATTERN)].flatMap(
      ([, column, type, scale]) => {
        const decimal = /^(?:numeric|decimal)$/i.test(type ?? '')
        return column === undefined ||
          type === undefined ||
          (decimal && scale !== undefined)
          ? []
          : [[column, type.toLowerCase()] as const]
      },
    ),
  )
