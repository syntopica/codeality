// PostgreSQL-only type advice, dropped when the same Kysely migrations also
// target MySQL/MariaDB or SQLite: a portable schema needs `varchar(n)` for an
// indexed or unique column on MySQL, `timestamp` without a zone there, and
// `integer` keys that every engine reads the same way. Following these rules
// would make the migrations PostgreSQL-only.
export const PORTABLE_SCHEMA_SQUAWK_EXCLUDES = [
  'prefer-text-field',
  'ban-char-field',
  'prefer-timestamp-tz',
  'prefer-bigint-over-int',
]
