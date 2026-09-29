import type { SqliteQueriesConfig } from '@/config/SqliteQueriesConfig.js'

export type SqliteConfig = { files: string[]; queries?: SqliteQueriesConfig }
