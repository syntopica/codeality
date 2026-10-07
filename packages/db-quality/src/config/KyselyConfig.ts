import type { KyselyMigrationsConfig } from '@/config/KyselyMigrationsConfig.js'

/** `databaseType` is reserved for the type-drift audit and not read yet. */
export type KyselyConfig = {
  roots: string[]
  objectNames: string[]
  migrations?: KyselyMigrationsConfig
  databaseType?: string
}
