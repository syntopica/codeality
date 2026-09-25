import type { SqlStatement } from '@/sql/SqlStatement.js'

export type MigrationFile = { path: string; statements: SqlStatement[] }
